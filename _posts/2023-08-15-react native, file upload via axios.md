---
layout: post
title: React Native, file upload via axios
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
---

Some years ago I remember I had to implement file uploads using react-native-fetch-blob. I tried it again this year and with pure Axios it is working just fine:

```ts
try{
	const formData = new FormData();

	formData.append('certificateFile', {
	  uri: isIOS ? uri.replace('file://', '') : uri,,
	  type: 'application/pem',
	  name: 'cert.pem',
	});

	await axi.post('/network/backend/certificate', formData, {
	  headers: {
	    'content-type': 'multipart/form-data',
	  },
	  transformRequest: (data: unknown) => data,
	});
	return {};
} catch (e) {
	return {error: 'Error uploading cert'};
}
```
