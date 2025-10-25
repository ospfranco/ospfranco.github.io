---
layout: post
title: Sharing state/messages between Springboot servers
excerpt: Message passing architecture between monolithic deployments via Redis
date: 2020-02-03 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
location: Munich
---

Here is a post on a neat solution I learned/developed during the WerkerApp days and I haven't gotten around to publish.

Imagine you have multiple instances of your (monolithic) server running somewhere in the cloud, you can have multiple instances because of scalability and/or redundancy, if one fails the others can pick up the task.

Now if you API is completely stateless, you can potentially spin as many as you want and you don't have to worry about data orchestration further than a few transactions on the database level, but what if you have some sort of real time communication or some sort of updatable state between the users connected to your service.

Let's take for example a chat application, the user opens you app and starts a websocket connection to your server so he can start receiving messages in real time, if you only had one instance of your server there is not much work needed at this point, users sends message, you insert it into the database and then redistribute the message to all (pertinent) connected users and/or schedule a wave of push notifications, however, with multiple instances the problem is not easy:

![Initial Architecture]({{site.url}}/assets/connections.png "Initial Architecture")

Not all the clients might be connected (via websocket) to the same instance, therefore you need to find a way to distribute the message between the different instances of your service,
now one option would be to hook up to the database after each transaction, retrieve the message and have each instance notify the subscribed clients, but that is technically fairly complicated.

Another alternative is to use redis, so, in a nutshell you put a redis instance which hooks up to all of your server instances and you use it in pub/sub mode:

![Redis Topology]({{site.url}}/assets/connections-1.png "Redis Topology")

You can read more about redis pub/sub mode [here](https://redis.io/topics/pubsub), the set up for redis will vary depending on your servers language, at the time I was using springboot with kotlin, [the set up is fairly complicated but managable](https://dzone.com/articles/intro-to-redis-with-spring-boot) it suffers from the typical java OOP pain of having to create many class instances, how you connect to your clients is up to you, but websockets seems like necessary to me.

So after you have everything in place, you should end up with a socket handler, this module receives all the messages that you get from the clients via websockets, so on top of this you can create a minimalistic protocol to handle some of the operations we will need.

When a client connects, it should send a SUBSCRIBE message, basically tells the server he wants to subscribe to a (or multiple) topic, this will follow your business logic, in our case at the time, the client needed to subscribe to all messages sent on a company level, so our topics where labelled company-wide, so we used the clients company id, after the server has subscribed to that particular topic, we store the websocket connection so we can use it afterwards to send the messages to that client.

When a clients wants to send a message to the topic (company in our case), it will reach the server via the same package, but it takes a slightly different route, you do all the necessary checks and pass the message to a lower layer, make the transaction on your db, etc. after all that work is done, the corresponding servier will publish the message to the redis company's topic.

So now that your server instance has a client listening for that specific topic, it will receive a message (it is a bit of a back-and-forth but it works), so now it is only a matter of selecting all the pertinent clients (websocket connections) for that corresponding company and distribute the message, so there you have it! all your web-server instances will distribute messages to all the connected clients.

Here is the code for socket handler, a bit simplified (it might contain some of the old business logic, but you can get the point):

```
package com.foo.common.SocketHandler

import com.fasterxml.jackson.databind.ObjectMapper
import com.foo.api.dto.DtoSocketStreamMessage
import com.foo.api.dto.DtoStreamEntry
import com.foo.api.dto.request.DtoSocketMessage
import com.foo.common.db.entity.DbStreamEntry
import com.foo.common.db.entity.DbToken
import com.foo.common.db.repository.ProjectRepository
import com.foo.common.db.repository.ProjectUserSettingsRepository
import com.foo.common.db.repository.UserRepository
import com.foo.common.redis.RedisMessagePublisher
import com.foo.common.service.MappingService
import com.foo.common.service.StreamService
import com.foo.common.service.TokenService
import org.apache.commons.logging.LogFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.redis.listener.ChannelTopic
import org.springframework.data.redis.listener.RedisMessageListenerContainer
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter
import org.springframework.stereotype.Service
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import java.sql.Timestamp
import java.time.LocalDateTime
import java.util.UUID


@Service
class SocketHandlerServiceImpl : SocketHandlerService() {

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var tokenService: TokenService

    @Autowired
    lateinit var streamService: StreamService

    @Autowired
    lateinit var mappingService: MappingService

    @Autowired
    lateinit var redisPublisher: RedisMessagePublisher

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var projectRepository: ProjectRepository

    @Autowired
    lateinit var redisContainer: RedisMessageListenerContainer

    @Autowired
    lateinit var messageListener: MessageListenerAdapter

    protected val logger = LogFactory.getLog(this.javaClass)!!

    var companySessions: MutableMap<UUID, MutableSet<WebSocketSession>?> = HashMap() // Mapped sessions per company, to send messages to all the users in a company
    var sessionUsers: MutableMap<WebSocketSession, DbToken> = HashMap() // Mapped user per session, to quickly retrieve the user of a particular session
    var sessionCompanies: MutableMap<WebSocketSession, UUID> = HashMap() // Mapped company per session, only for efficient memory clean

    // Prevent memory leaks by tidying up connection pool after a connection has closed
    override fun afterConnectionClosed(session: WebSocketSession?, status: CloseStatus?) {
        super.afterConnectionClosed(session, status)

        // Prevent memory leak
        // First remove reference to user reference
        if(sessionUsers.containsKey(session)) {
            sessionUsers.remove(session)
        }

        // then clean companySession and companySession set
        val sessionCompany = sessionCompanies[session]
        if(sessionCompany != null) {
            companySessions.put(sessionCompany, companySessions[sessionCompany]!!.filter { it.isOpen }.toHashSet())
            if(companySessions[sessionCompany] != null && companySessions[sessionCompany]!!.isEmpty()) {
                // No more sockets are connected for a company, unsubscribe from redis
                redisContainer.removeMessageListener(messageListener, ChannelTopic(sessionCompany.toString()))
            }

            sessionCompanies.remove(session)
        }
    }

    override fun sendTerminateConnectionMessage(session: WebSocketSession, errorDescription: String) {
        val dto = DtoSocketStreamMessage()
        dto.type = "TERMINATE_CONNECTION"
        dto.text = errorDescription

        dto.entry = DtoStreamEntry()
        dto.entry!!.projectId = UUID.fromString("88888888-8888-8888-8888-888888888888") // Nothing random about this UUID
        dto.entry!!.id = UUID.randomUUID()

        session.sendMessage(TextMessage(objectMapper.writeValueAsString(dto)))
    }

    override fun sendSuccessfulSubscriptionMessage(session: WebSocketSession, companyId: String) {
        val dto = DtoSocketStreamMessage()
        dto.type = "SUBSCRIPTION_SUCCESSFUL"
        dto.text = companyId

        dto.entry = DtoStreamEntry()
        dto.entry!!.projectId = UUID.fromString("88888888-8888-8888-8888-888888888888") // Nothing random about this UUID
        dto.entry!!.id = UUID.randomUUID()

        session.sendMessage(TextMessage(objectMapper.writeValueAsString(dto)))
    }

    override fun handleTextMessage(session: WebSocketSession, textMessage: TextMessage) {
        val message = objectMapper.readValue<DtoSocketMessage>(textMessage.payload.toString(), DtoSocketMessage::class.java)

        // Check that socket message contains a token field
        if (message.token == null) {
            val agent = session.handshakeHeaders["User-Agent"]
            val forwarding = session.handshakeHeaders["X-forwarded-for"]
            logger.warn("No token was provided. agent: $agent X: $forwarding")
            sendTerminateConnectionMessage(session, "NO_TOKEN_PROVIDED")
            return
        }

        val token = tokenService.getToken(message.token!!)

        // Check if token is exists and is valid
        if (token == null || Timestamp.valueOf(LocalDateTime.now()).after(token.expirationDate)) {
            logger.warn("Socket message contains no valid token or token is expired")
            sendTerminateConnectionMessage(session, "INVALID_TOKEN")
            return
        }

        if (message.type == "SUBSCRIBE") {
            val companyId = token.user.company!!.id!!

            // Add socket session to current pool of sessions
            if(companySessions[companyId] == null) {
                companySessions[companyId] = HashSet()
            }

            companySessions[companyId]!!.add(session)

            // Assign session to user
            sessionUsers[session] = token

            // Assign session to company
            sessionCompanies[session] = companyId

            redisContainer.addMessageListener(messageListener, ChannelTopic(companyId.toString()))

            sendSuccessfulSubscriptionMessage(session, companyId.toString() )
        }
    }

    override fun dispatchToRedis(entry: DbStreamEntry) {
        val dtoSocketStreamEntry = mappingService.mapSocketStreamEntry(entry)

        // publish to the corresponding redis topic in this case the company id!!!!
        redisPublisher.publish(entry.company.id.toString(), objectMapper.writeValueAsString(dtoSocketStreamEntry))
    }

    override fun redisMessageReceived(dtoEntry: DtoSocketStreamMessage) {
        val socketsToDispatch = companySessions[dtoEntry.entry!!.companyId]

        val filteredSockets = socketsToDispatch?.filter { it.isOpen }
        val project = projectRepository.findOne(dtoEntry.project!!.id)

        filteredSockets?.forEach {
            val targetUser = sessionUsers[it]!!.user
            val projectUserSettings = projectUserSettingsRepository.findOneByUserAndProject(targetUser, project)

            it.sendMessage(TextMessage(objectMapper.writeValueAsString(dtoEntry)))
        }
    }

    override fun countSockets(): Int {
        return sessionUsers.size
    }
}
```

You can always scale up your Redis instance to handle more messages, you should use a load balancer to route the connections between your instances to keep the load uniform and make sure you are not running out of memory for the connections, which might mean more advanced routing in the future.

Your client should also have some reconnection code handling in case one of your instances goes down, it should try to re-establish a connection if it's web socket connection gets suddenly terminated.

You might hit bottle neck on your database, but that is not the fault of this architecture, you will reach it anyways and that point you might want to split specific table into it's own database, this pattern should remain the same, even further scale might need for you to switch into a microservice architecture.

If you are using a microservice architecture this might or might not be useful to you, however if you are having a monolithic architecture and you need some solution to pass messages between your instances then this will definitely help you, enjoy!
