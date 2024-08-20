const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

// Import dependencies
const getFBInfo = require("@xaviabot/fb-downloader");
const idl = require("i-downloader");

const app = express();
const port = 3000;

app.use(cors());

// Stream Facebook video directly to client
app.get("/fb", async (req, res) => {
  const video = req.query.video;

  try {
    const result = await getFBInfo(video);

    if (result && result.download) {
      const videoUrl = result.download.hd || result.download.sd; // Prefer HD if available

      res.header("Content-Disposition", 'attachment; filename="video.mp4"');
      res.header("Content-Type", "video/mp4");

      // Stream the video to the client
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video from ${videoUrl}`);
      }
      response.body.pipe(res);
    } else {
      res.status(404).send("Video not found or could not be downloaded.");
    }
  } catch (error) {
    console.error("Error downloading Facebook video:", error);
    res.status(500).send("Error processing your request.");
  }
});

// Instagram API
app.get("/insta", async (req, res) => {
  const link = req.query.link;

  try {
    const resData = await idl(link);
    res.json(resData);
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    res.status(500).send("Error processing your request.");
  }
});

// Example of an existing route
app.get("/", (req, res) => {
  res.send("Welcome to the video downloader API!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
