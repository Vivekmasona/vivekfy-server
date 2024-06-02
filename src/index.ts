import express from 'express';
import ytdl from 'ytdl-core';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

let sessions: { [key: string]: any } = {};

// Original functionality for controlling sessions
app.post('/control', (req, res) => {
  const { action, value, sessionId } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = { url: '', status: 'stop', volume: 100, action: null, value: null, lastSkipValue: null, lastSkipDirection: null };
  }

  const session = sessions[sessionId];

  if (action === 'skip') {
    const direction = value > session.lastSkipValue ? 'forward' : 'backward';

    if (value !== session.lastSkipValue || direction !== session.lastSkipDirection) {
      session.lastSkipValue = value;
      session.lastSkipDirection = direction;
      session.action = action;
      session.value = value;
      res.json({ status: 'Skip action processed', action, value, sessionId });
    } else {
      res.json({ status: 'Skip action ignored', action, value, sessionId });
    }
  } else {
    session.action = action;
    session.value = value;
    res.json({ status: 'Command received', action, value, sessionId });
  }
});

app.post('/update-url', (req, res) => {
  const { url, sessionId } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = { url: '', status: 'stop', volume: 100, action: null, value: null, lastSkipValue: null, lastSkipDirection: null };
  }

  sessions[sessionId].url = url;
  res.json({ status: 'URL updated', sessionId });
});

app.get('/current-url/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  res.json({
    success: true,
    sessionId,
    url: sessions[sessionId].url,
    status: sessions[sessionId].status,
    volume: sessions[sessionId].volume,
    action: sessions[sessionId].action,
    value: sessions[sessionId].value
  });
});

// New functionality for YouTube handling
app.get('/hack', async (req, res) => {
  const url = req.query.url as string;

  try {
    const info = await ytdl.getInfo(url);
    const { title, thumbnails, formats } = info.videoDetails;
    const thumbnail = thumbnails[0].url;
    const audioFormats = ytdl.filterFormats(formats, 'audioonly');

    res.json({ title, thumbnail, audioFormats, formats });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching video info.');
  }
});

app.get('/video', async (req, res) => {
  const ytUrl = req.query.url as string;

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
    console.error('Error:', error);
    res.status(500).send('Error fetching videoplayback URL.');
  }
});

app.get('/audio', async (req, res) => {
  const ytUrl = req.query.url as string;

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

    const lowestQualityAudio = audioFormats.reduce((lowest, format) =>
      format.audioBitrate < lowest.audioBitrate ? format : lowest
    );

    res.redirect(lowestQualityAudio.url);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching low-quality audio stream URL.');
  }
});

app.get('/download/audio', async (req, res) => {
  const videoURL = req.query.url as string;

  if (!videoURL) {
    return res.status(400).send('Missing video URL');
  }

  try {
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
  const videoURL = req.query.url as string;

  if (!videoURL) {
    return res.status(400).send('Missing video URL');
  }

  try {
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

app.get('/low-audio', async (req, res) => {
  const url = req.query.url as string;

  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }

  try {
    ytdl(url, { filter: 'audioonly', quality: 'lowest' }).pipe(res);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error fetching low-quality audio.');
  }
});

app.get('/download', (req, res) => {
  const URL = req.query.URL as string;

  if (!URL) {
    return res.status(400).send('Missing URL parameter');
  }

  try {
    res.setHeader('Content-Disposition', `attachment; filename="download(vivek masona).mp4"`);
    ytdl(URL, { format: 'mp4' }).pipe(res);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error downloading video.');
  }
});

app.get('/', (req, res) => {
  res.json({ query: 'None' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

