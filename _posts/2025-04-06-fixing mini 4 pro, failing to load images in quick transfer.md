---
layout: post
title: Fixing mini 4 pro, failing to load images in quick transfer
date: 2025-04-06
categories: post
permalink: /:title/
image: /assets/oscar.jpg
---

I have a DJI Mini Pro drone (had the 3 two times and lost them, and now a 4). I love this little thing. However, I have a few issues with this delicate piece of technology.

First one that seems non-solvable are transfer speeds. The 3 would do 10 to 20 mbits/s transfer. This new one seems to be a lot slower 1 to 3 mbits/second. Scouring online, seems to suggest one needs to turn off celullar data and the issue might go away. Big problem, but nothing I can do about that.

However, I had a more serious issue the other day. Here are some steps for those unlucky souls like me.

When entering quick-transfer mode all of the sudden none of the pictures/videos would show in the gallery. All I got was a "Failed to load, tap to try again" message on the screen.

I did all I could think off:

- Drone, controller and app where updated
- Check SD card on computer
- Format SD card
- Reset all settings on drone
- Mutiple restarts, with SD card out, letting the drone sit idle, etc.
- Try a different SD card

I got in touch with DJI support, they pointed me to [one tool](https://www.dji.com/jp/downloads/softwares/dji-assistant-2-consumer-drones-series) they have to reflash the firmware

After multiple reflashes and a downgrade, it was still not working. I was about to give up when just clicking through the settings I noticed the internal storage had 0 free space (should have 2 gb). Knowning what I know about computers, this was a desperate last attempt to get it working. I formated the internal storage and voila! All of the sudden the gallery started working again.

This is clearly an oversight on DJI's firmware. Lack of error messages/user feedback to debug the issue. Etc. At least I got the drone back in working order, so hopefully this will be useful to others.
