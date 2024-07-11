import express from 'express';
import ytdl from 'ytdl-core';
import { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get("/hack", async (req, res) => {
  const url = req.query.url;
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails[0].url;
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

    res.send({ title, thumbnail, audioFormats });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching video info.');
  }
});

app.get('/video', async (req, res) => {
  const ytUrl = req.query.url;

  if (!ytUrl) {
    res.status(400).send('YouTube video URL parameter is missing.');
    return;
  }

  try {
    const info = await ytdl.getInfo(ytUrl);
    const videoInfo = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    const videoplaybackUrl = videoInfo.url;

    res.redirect(videoplaybackUrl);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching videoplayback URL.');
  }
});

app.get('/audio', async (req, res) => {
  const ytUrl = req.query.url;

  if (!ytUrl) {
    res.status(400).send('YouTube video URL parameter is missing.');
    return;
  }

  try {
    const info = await ytdl.getInfo(ytUrl);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length === 0) {
      res.status(404).send('No audio stream found for this video.');
      return;
    }

    const lowestQualityAudio = audioFormats.reduce((lowest, format) => {
      return format.audioBitrate < lowest.audioBitrate ? format : lowest;
    });

    const audioUrl = lowestQualityAudio.url;
    res.redirect(audioUrl);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching low-quality audio stream URL.');
  }
});

app.get('/download/audio', async (req, res) => {
  try {
    const videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '') || 'audio';
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    const format = audioFormats[0];
    if (!format) {
      return res.status(404).send('No suitable audio format found');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    ytdl(videoURL, { format }).pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/download/video', async (req, res) => {
  try {
    const videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '') || 'video';

    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    if (!format) {
      return res.status(404).send('No suitable video format found');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    ytdl(videoURL, { format }).pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req: Request, res: Response) => {
  res.json({ query: 'None' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
