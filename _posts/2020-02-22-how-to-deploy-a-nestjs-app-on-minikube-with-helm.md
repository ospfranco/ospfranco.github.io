---
layout: post
title: How to deploy a nestjs app on minikube with helm
description: A simple tutorial to get your foot on the door with kubernetes
date: 2020-02-22 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: /assets/boat.jpg
---

In order to release the SaaS version of my new product [Strest](www.strest.io), I've decided to use Kubernetes, you keep hearing all the yapping about it and it promises scalability right from the get go, which is what I need, so I'm giving up to the complexity and (finally) learning it, I have run into a lot of problems and I'm still not through with the learning face, but the simple packaging and deployment of a sample app was so painful that I've decided to write something down, not only as a log for me to better retain the knowledge but hopefully also helping anybody struggling to do their first deployment.

Prerequisites:

- npm or [volta](volta.sh)
- [brew](brew.sh)
- docker
- minikube (`brew install minikube`): allows to run a local k8s cluster
- helm (`brew install kubernetes-helm`): package manager? it does a lot, hard to describe it
- nest cli (`npm install -g @nest/cli` or `volta install @nestjs/cli`): a cli for nest

0. **Basics**

    If you are an absolute noob to k8s and need a run down from the very first basic commands go watch this [intro video](https://www.youtube.com/watch?v=gpmerrSpbHg) by Level-Up academy, it is fairly long and a bit outdated by 2020 but it is still very good, it gets the concepts across and lays the foundation for later.

1. **Set up a Nest project**

    Immediately afterwards, I was left with a bunch of questions, it seemed fairly obvious I could just write a bunch of yaml files and start deploying things, but I still decided to look for a specific guide on how to deploy a node application to minikube... what I found was many many outdated articles, a barrage of tools (helm, draft, etc.) and still very complex information, so let's just start by creating a sample nest application

    - Create a new project: `nest new my-project`
    - Make sure your project runs: `yarn start` and then navigate to your localhost and port (in my case https://localhost:3000)

2. **Dockerize it**

    I had actually done this a couple of times before but I forgot about it, so I'm just gona do a quick run down here

    - Create a Dockerfile on the root of your nest project
    - You can *copy&paste* this for now:

    ```
    FROM node:12-alpine
    
    WORKDIR /app
    COPY . .
    RUN yarn install
    RUN yarn build
    CMD yarn start:prod
    ```

    - Won't go over the semantics of it, docker is a topic on it's own, open a terminal (if you haven't already) and move the root of your project
    - Now, you could build the image and push it to docker-hub, but I wanted to get going as fast a possible, we are just going to use the minikube docker environment to build the image, that way there is no need to push it anywhere, if you haven't started minikube yet, do `minikube start` this creates a minikube cluster with a single k8s node, once that is running do: `eval $(minikube docker-env)`, with this we have replaced the docker environment of you local machine for the docker environment in the minikube instance (only for the terminal session you just typed it in), that way we can just build an image and it will be available to pull when deploying via helm.
    - `docker build -t my-project/server` this will build an docker image of your application
    - extra: `docker images` should show your image has been correctly created and is ready to be pulled on our deployment, you can ignore all the k8s stuff.

3. **Helm**

    This was by far the most difficult part to get a grip on, the abundance of tools and their complexity was honestly surprising, I started with draft... could not get that to work, I then tried pure helm and most of the tutorials on the internet seem outdated (hello `helm init`) and even after finding the right command, the complexity of the default created files stunned me for a while, until I finally found a [video](https://www.youtube.com/watch?v=9cwjtN3gkD4) that made sense, go watch it, it is 12 mins long but very densely packed with information.

    I'm not going to into the same detail as in the video, but paste the final content of my files here, while also some minor updates because that video is also somewhat outdated and not everything worked out of the box.

    - You can put your nest app in a containing folder (I recommend this), because your deployment might contain more than just your nest server, on that new root folder do `helm create my-project-chart`, this will set up a basic file structure for helm.
    - Now the biggest take away from the video, was to realise... most of the stuff created by `helm create` is just crap, waaaay to advanced for our purposes, so you just reduce the files to something like this:
    
    File structure:
    ```
    my-project-chart/
    ├── charts/
    ├── templates/
    │   ├── _helpers.tpl
    │   └── application.yaml
    ├── .helmignore
    ├── Chart.yaml
    └── values.yaml
    ```

    values.yaml: can remain empty for now
    application.yaml:
    ```
    {% raw %}
    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: {{ include "my-project-chart.fullname" . }}-deployment
    spec:
    replicas: 1
    selector:
        matchLabels:
        app: {{ include "my-project-chart.fullname" . }}
    template:
        metadata:
        labels:
            app: {{ include "my-project-chart.fullname" . }}
        spec:
        containers:
            - name: strest-server
            image: strest/server
            imagePullPolicy: IfNotPresent

    ---

    apiVersion: v1
    kind: Service
    metadata:
    name: {{ include "my-project-chart.fullname" . }}-service
    spec:
    type: NodePort
    selector:
        app: {{ include "my-project-chart.fullname" . }}
    ports:
        - port: 8080
        targetPort: 3000
    ```
    {% endraw %}

    - This is pretty much the same info as on the video, however there are some minor differences that bit me in rear, one is the functionality of helm seems to have changed for the fullname, no longer is it `template foo.fullname` but rather `include "foo.fullname" .`, second is, in order to pull our image from the local docker engine the `imagePullPolicy` (under template -> spec -> containers) needs to be set to `IfNotPresent`, otherwise the image does not deploy, also I'm using a `NodePort` service here to route to the container, which is... not what you want to do in production, from what I understand `Ingress` is what you want to use, but I haven't learned to configure it yet, `NodePort` directly exposes the pod, you can also go for `LoadBalancer`, but that might require a slightly different configuration
    - Extra: you can do `helm template .` to check if your template text expansions are working properly, there needs to be no errors on the output
    - You can now do `helm install . --generate-name` (the generate name part is nowadays also necessary)

4. **Profit**

    - You made it! if everything has gone well, your sample app should have now deployed
    - `kubectl get pods` should show your nest-js pod running
    - `minikube service list` should show your service running
    - `minikube service <name of your service>` TADA, browser is open and it is running your application

Uff... that doesn't look so bad, but it basically took me a day of muddling through github repos, outdated tutorials, reading a lot of documentation to figure out something as simple as local deployment.

I still haven't figured out how am I going to deploy a DB for my service (I actually need 2 different ones) and how do cloud providers handle this, of course RDS (AWS) needs to be running but I'm still not sure if it should somehow be specified on my helm chart definition and what not, another question is how do you set up a test environment for CI to run tests on, next article will probably on that topic.
