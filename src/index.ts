import express from 'express';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/audio/:url', async (req: Request, res: Response) => {
  const urlParam = req.params.url;
  const url = `https://www.youtube.com/watch?v=${urlParam}`;
  try {
    const info = await ytdl.getInfo(url);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    const audioUrl = audioFormat.url;

    res.redirect(audioUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get audio URL!' });
  }
});

app.get('/video/:url', async (req: Request, res: Response) => {
  const urlParam = req.params.url;
  const url = `https://www.youtube.com/watch?v=${urlParam}`;
  try {
    const info = await ytdl.getInfo(url);
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });

    const videoUrl = videoFormat.url;

    res.redirect(videoUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get video URL!' });
  }
});

app.get('/videoinfo/:url', async (req: Request, res: Response) => {
  try {
    const urlParam = req.params.url;
    const url = `https://www.youtube.com/watch?v=${urlParam}`;

    const info = await ytdl.getInfo(url);

    res.json({
      author: info.videoDetails.author,
      title: info.videoDetails.title,
      views: info.videoDetails.viewCount,
      thumbnail: info.videoDetails.thumbnails
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video information' });
  }
});

app.get('/dl', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;
  if (!videoUrl) {
    return res.status(400).send('Please provide a valid YouTube video URL as a query parameter');
  }

  function getYouTubeVideoId(url: string): string | null {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    return params.get('v') || urlObj.pathname.split('/').pop() || null;
  }

  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) {
    return res.status(400).send('Invalid YouTube video URL');
  }

  const provider = 'https://api.cobalt.tools/api/json';
  const streamUrl = `https://youtu.be/${videoId}`;
  try {
    const response = await fetch(provider, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: streamUrl,
        isAudioOnly: true,
        aFormat: 'mp3', // Assuming mp3 format for simplicity
        filenamePattern: 'basic'
      })
    });

    const result = await response.json();
    res.redirect(result.url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download audio: ' + error.message });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    query: 'None'
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
