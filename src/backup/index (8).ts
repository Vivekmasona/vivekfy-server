import express from 'express';
import ytdl from 'ytdl-core';
import axios from 'axios';
import { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Function to sanitize input URL
function sanitizeURL(url: string): string {
  return url.replace(/[^a-zA-Z0-9-_.~:/?#[\]@!$&'()*+,;=%]/g, '');
}

// Function to extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  return params.get('v') || urlObj.pathname.split('/').pop() || null;
}

// New /redirect endpoint
app.get('/redirect', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;
  if (!videoUrl) {
    return res.status(400).send('Please provide a YouTube video URL as a parameter (e.g., ?url=ytlink).');
  }

  try {
    const response = await axios.get(`https://vivekplay.vercel.app/api/info?url=${encodeURIComponent(videoUrl)}`);
    const info = response.data;

    if (info.formats && Array.isArray(info.formats)) {
      for (const format of info.formats) {
        if (format.format_note === 'low' && format.acodec === 'mp4a.40.5') {
          return res.redirect(format.url);
        }
      }
    }

    res.send("Unable to find a suitable audio format for playback.");
  } catch (error) {
    res.send("An error occurred while fetching video info.");
  }
});

// /api endpoint
app.get('/api', (req: Request, res: Response) => {
  const link: string = req.query.url ? sanitizeURL(req.query.url as string) : '';

  if (link) {
    let serverLink: string;

    if (link.includes('youtu.be') || link.includes('youtube.com')) {
      serverLink = `https://vivekfy.fanclub.rocks/audio?url=${link}`;
    } else if (link.includes('facebook.com')) {
      serverLink = `https://vivekfy.fanclub.rocks/api/server/fb?link=${link}`;
    } else if (link.includes('instagram.com')) {
      serverLink = `https://vivekfy.fanclub.rocks/api/server/insta?link=${link}`;
    } else {
      serverLink = 'Unsupported service';
    }

    if (serverLink !== 'Unsupported service') {
      res.redirect(serverLink);
    } else {
      res.send(serverLink);
    }
  } else {
    res.send('Invalid URL');
  }
});

// Route to fetch video information and formats
app.get("/hack", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).send('YouTube video URL parameter is missing.');
  }

  try {
    const info = await ytdl.getInfo(url);
    const { title, thumbnails, formats } = info.videoDetails;
    const thumbnail = thumbnails[0].url;
    const audioFormats = ytdl.filterFormats(formats, 'audioonly');
    const filteredFormats = formats.filter(format => format.hasAudio);

    res.json({ title, thumbnail, audioFormats, formats: filteredFormats });
  } catch (error) {
    res.status(500).send('Error fetching video info.');
  }
});

// Route to get direct video playback URL
app.get('/video', async (req, res) => {
  const ytUrl = req.query.url as string;
  if (!ytUrl) {
    return res.status(400).send('YouTube video URL parameter is missing.');
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

// Route to get direct low-quality audio stream URL
app.get('/audio1', async (req, res) => {
  const ytUrl = req.query.url as string;
  if (!ytUrl) {
    return res.status(400).send('YouTube video URL parameter is missing.');
  }

  try {
    const info = await ytdl.getInfo(ytUrl);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length === 0) {
      return res.status(404).send('No audio stream found for this video.');
    }

    const lowestQualityAudio = audioFormats.reduce((lowest, format) => {
      return format.audioBitrate < lowest.audioBitrate ? format : lowest;
    });

    res.redirect(lowestQualityAudio.url);
  } catch (error) {
    res.status(500).send('Error fetching low-quality audio stream URL.');
  }
});

// Route for downloading audio
app.get('/download/audio', async (req, res) => {
  const videoURL = req.query.url as string;
  if (!videoURL) {
    return res.status(400).send('Missing video URL');
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const sanitizedTitle = videoTitle || 'audio';
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    const format = audioFormats[0];

    if (!format) {
      return res.status(404).send('No suitable audio format found');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    format.contentLength && res.setHeader('Content-Length', format.contentLength);

    ytdl(videoURL, { format }).pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route for downloading video
app.get('/download/video', async (req, res) => {
  const videoURL = req.query.url as string;
  if (!videoURL) {
    return res.status(400).send('Missing video URL');
  }

  try {
    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const sanitizedTitle = videoTitle || 'video';
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    if (!format) {
      return res.status(404).send('No suitable video format found');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    format.contentLength && res.setHeader('Content-Length', format.contentLength);

    ytdl(videoURL, { format }).pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to download low-quality audio
app.get("/low-audio", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).send('YouTube video URL parameter is missing.');
  }

  try {
    ytdl(url, {
      format: 'mp3',
      filter: 'audioonly',
      quality: 'lowest'
    }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching low-quality audio.');
  }
});

// Route to download video
app.get("/download", function(req, res){
  const URL = req.query.URL as string;
  const sanitizedTitle = 'video'; // You should define a proper sanitizedTitle

  if (!URL) {
    return res.status(400).send('Missing video URL');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp4"`);
  ytdl(URL, { format: 'mp4' }).pipe(res);
});

// Route for direct media download via a third-party API
app.get('/savevideo', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;

  if (!videoUrl) {
    return res.status(400).send('Please provide a valid URL as a query parameter');
  }

  const provider = 'https://api.cobalt.tools/api/json'; // Default Cobalt API endpoint

  try {
    const response = await axios.post(provider, {
      url: videoUrl,
      isAudioOnly: false, // Set to false to download video
      aFormat: 'mp4',    // Change format to mp4 or desired video format
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    const result = response.data;
    res.redirect(result.url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download media: ' + error.message });
  }
});

// Route for direct media download via a third-party API
app.get('/saveaudio', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;

  if (!videoUrl) {
    return res.status(400).send('Please provide a valid URL as a query parameter');
  }

  const provider = 'https://api.cobalt.tools/api/json'; // Default Cobalt API endpoint

  try {
    const response = await axios.post(provider, {
      url: videoUrl,
      isAudioOnly: true, // Adjust this if needed
      aFormat: 'mp3',   // Adjust this if needed
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    const result = response.data;
    res.redirect(result.url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download media: ' + error.message });
  }
});

// Route for direct audio download via a third-party API
app.get('/dl', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;
  if (!videoUrl) {
    return res.status(400).send('Please provide a valid YouTube video URL as a query parameter');
  }

  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) {
    return res.status(400).send('Invalid YouTube video URL');
  }

  const provider = 'https://api.cobalt.tools/api/json';
  const streamUrl = `https://youtu.be/${videoId}`;
  try {
    const response = await axios.post(provider, {
      url: streamUrl,
      isAudioOnly: true,
      aFormat: 'mp3',
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });
const result = response.data;
    res.redirect(result.url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download audio: ' + error.message });
  }
});
app.get('/img', async (req: Request, res: Response) => {
    const videoId = req.query.videoId;

    if (!videoId || typeof videoId !== 'string') {
        return res.status(400).send('Invalid video ID');
    }

    const apiUrl = `https://youtubeforever.vercel.app/videoinfo/${videoId}`;

    try {
        const response = await axios.get(apiUrl);
        const channelData = response.data;
        const thumbnails = channelData.author.thumbnails;
        const thumbnail176 = thumbnails.find((thumbnail: any) => thumbnail.width === 176 && thumbnail.height === 176);

        if (thumbnail176) {
            return res.redirect(thumbnail176.url);
        } else {
            return res.status(404).send('176x176 thumbnail not found');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error fetching data');
    }
});


// Default route
app.get('/', (req: Request, res: Response) => {
  res.json({ query: 'None' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
     
