
import express from 'express'
import ytdl from 'ytdl-core'
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

app.get("/hack", async (req, res) => {
  const url = req.query.url;
  console.log(url);
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title;
  const thumbnail = info.videoDetails.thumbnails[0].url;
  let formats = info.formats;

  const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
 
  // const format = ytdl.chooseFormat(info.formats, { quality: "249" });
  formats = formats.filter((format) => format.hasAudio === true);

  res.send({ title, thumbnail, audioFormats, formats });
});
// Define a route to get the direct videoplayback URL from a YouTube URL
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

    // Redirect to the direct videoplayback URL for the video
    res.redirect(videoplaybackUrl);
  } catch (error) {
    res.status(500).send('Error fetching videoplayback URL.');
  }
})

// Define a route to get the direct low-quality audio stream URL from a YouTube URL
app.get('/audio1', async (req, res) => {
  const ytUrl = req.query.url;

  if (!ytUrl) {
    res.status(400).send('YouTube video URL parameter is missing.');
    return;
  }

  try {
    const info = await ytdl.getInfo(ytUrl);

    // Filter formats to get only audio streams (excluding video)
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length === 0) {
      res.status(404).send('No audio stream found for this video.');
      return;
    }

    // Find the audio format with the lowest quality
    let lowestQualityAudio = audioFormats[0];
    for (const format of audioFormats) {
      if (format.audioBitrate < lowestQualityAudio.audioBitrate) {
        lowestQualityAudio = format;
      }
    }

    const audioUrl = lowestQualityAudio.url;

    // Redirect to the direct low-quality audio stream URL
    res.redirect(audioUrl);
  } catch (error) {
    res.status(500).send('Error fetching low-quality audio stream URL.');
  }
})


// Route for downloading audio
app.get('/download/audio', async (req, res) => {
  try {
    const videoURL = req.query.url; // Get the YouTube video URL from the query parameter

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    // Get information about the video
    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const autoTitle = videoTitle.replace(/[^\w\s]/gi, ''); // Remove special characters from the title
    const sanitizedTitle = autoTitle || 'audio'; // Use the sanitized title or 'audio' as a default
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    // Select the best available audio format
    const format = audioFormats[0];

    if (!format) {
      return res.status(404).send('No suitable audio format found');
    }

    // Get the content length (file size) of the audio
    const contentLength = format.contentLength;

    // Set response headers to specify a downloadable audio file with the auto-generated title
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', contentLength); // Add content length to the headers

    // Pipe the audio stream into the response
    ytdl(videoURL, { format }).pipe(res);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
})

// Route for downloading video
app.get('/download/video', async (req, res) => {
  try {
    const videoURL = req.query.url; // Get the YouTube video URL from the query parameter

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    // Get information about the video
    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const autoTitle = videoTitle.replace(/[^\w\s]/gi, ''); // Remove special characters from the title
    const sanitizedTitle = autoTitle || 'video'; // Use the sanitized title or 'video' as a default

    // Select the best available video format
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    if (!format) {
      return res.status(404).send('No suitable video format found');
    }

    // Get the content length (file size) of the video
    const contentLength = format.contentLength;

    // Set response headers to specify a downloadable video file with the auto-generated title
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', contentLength); // Add content length to the headers

    // Pipe the video stream into the response
    ytdl(videoURL, { format }).pipe(res);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get("/low-audio", async (req, res) => {
  const url = req.query.url;
  const itag = req.query.itag;
  const type = req.query.type;

  // const info = await ytdl.getInfo(url);
  // const title = info.videoDetails.title;

  // res.header("Content-Disposition", `attachment;  filename="Download from.vivekmasona"`);
  try {
    ytdl(url, {
            format: 'mp3',
            filter: 'audioonly',
            quality: 'lowest'
        }).pipe(res);

    } catch (err) {
        console.error(err);
    }
})

app.get("/download", function(req,res){
    var URL = req.query.URL
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}(vivek masona).mp4"`);

    ytdl(URL, {
        format: 'mp4'
        }).pipe(res)
})

//app.get("/*", function(req,res){
 // res.redirect("/")
//})


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


// Endpoint to handle GET requests
app.get('/audio', async (req, res) => {
    try {
        const youtubeUrl = req.query.url;
        const apiUrl = `https://vivekplay.vercel.app/api/info?url=${encodeURIComponent(youtubeUrl)}`;

        // Make a fetch request to get JSON data from vivekplay API
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Find the format with format_id '140'
        const audioFormat = data.find(format => format.format_id === '140');
        if (!audioFormat) {
            throw new Error('Format 140 not found in the response.');
        }

        const playbackUrl = audioFormat.url;
        console.log("Playback URL:", playbackUrl);

        // Redirect to the 140 format URL
        res.redirect(playbackUrl);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Error fetching or redirecting.');
    }
});






app.get('/', (req: Request, res: Response) => {
  res.json({
    query: 'None'
  })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})




