const { getLinkPreview } = require("link-preview-js");
const https = require("https");
const Stream = require("stream").Transform;
const fs = require("fs");

getLinkPreview("https://github.com/ospfranco/link-preview-js").then((res) => {
  const imageUrl = res.images[0];

  https
    .request(imageUrl, (imageRes) => {
      const data = new Stream();

      imageRes.on("data", (chunk) => {
        data.push(chunk);
      });

      imageRes.on("end", () => {
        fs.writeFileSync("assets/linkPreview.png", data.read());
      });
    })
    .end();
});

getLinkPreview("https://github.com/ospfranco/react-native-quick-sqlite").then(
  (res) => {
    const imageUrl = res.images[0];

    https
      .request(imageUrl, (imageRes) => {
        const data = new Stream();

        imageRes.on("data", (chunk) => {
          data.push(chunk);
        });

        imageRes.on("end", () => {
          fs.writeFileSync("assets/quicksqlite.png", data.read());
        });
      })
      .end();
  }
);
