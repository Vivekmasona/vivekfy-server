import express from 'express';
import ytdl from 'ytdl-core';
import request from 'request';
import { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Route for getting the direct videoplayback URL from a YouTube URL
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
    res.status(500).send('Error fetching videoplayback URL.');
  }
});

// Route for getting the direct low-quality audio stream URL from a YouTube URL
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

    let lowestQualityAudio = audioFormats[0];
    for (const format of audioFormats) {
      if (format.audioBitrate < lowestQualityAudio.audioBitrate) {
        lowestQualityAudio = format;
      }
    }

    const audioUrl = lowestQualityAudio.url;

    res.redirect(audioUrl);
  } catch (error) {
    res.status(500).send('Error fetching low-quality audio stream URL.');
  }
});

// Route for downloading audio
app.get('/download/audio', async (req, res) => {
  try {
    const videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const autoTitle = videoTitle.replace(/[^\w\s]/gi, '');
    const sanitizedTitle = autoTitle || 'audio';
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    const format = audioFormats[0];

    if (!format) {
      return res.status(404).send('No suitable audio format found');
    }

    const contentLength = format.contentLength;

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', contentLength);

    ytdl(videoURL, { format }).pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for downloading video
app.get('/download/video', async (req, res) => {
  try {
    const videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const autoTitle = videoTitle.replace(/[^\w\s]/gi, '');
    const sanitizedTitle = autoTitle || 'video';

    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    if (!format) {
      return res.status(404).send('No suitable video format found');
    }

    const contentLength = format.contentLength;

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', contentLength);

    ytdl(videoURL, { format }).pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for getting low-quality audio directly
app.get('/low-audio', async (req, res) => {
  const url = req.query.url;

  try {
    ytdl(url, {
      format: 'mp3',
      filter: 'audioonly',
      quality: 'lowest'
    }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Route for making a request to the RapidAPI YouTube MP3 downloader
app.get('/xyz', (req, res) => {
  const videoId = req.query.id;

  if (!videoId) {
    res.status(400).send('YouTube video ID parameter is missing.');
    return;
  }

  const options = {
    method: 'GET',
    url: 'https://youtube-mp36.p.rapidapi.com/dl',
    qs: { id: videoId },
    headers: {
      'X-RapidAPI-Key': '11939ea42cmsh9be181f6708fc39p162794jsn9e46f87d898b',
      'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
    }
  };

  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send('Internal Server Error');
    } else {
      res.send(body);
    }
  });
});

// Default route
app.get('/', (req: Request, res: Response) => {
  res.json({
    query: 'None'
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

