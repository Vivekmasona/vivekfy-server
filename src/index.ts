import express from 'express'
import ytdl from 'ytdl-core'
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

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

app.get('/play/:url', async (req: Request, res: Response) => {
  const urlParam = req.params.url
  const url = `https://www.youtube.com/watch?v=${urlParam}`
  try {
    const info = await ytdl.getInfo(url as string)
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' } )

    const videoUrl = videoFormat.url

    res.redirect(videoUrl)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get audio URL!' })
  }
})


// Define a route to get the direct low-quality audio stream URL from a YouTube URL
app.get('/audio', async (req, res) => {
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

app.get('/download', async (req, res) => {
  try {
    const videoURL = req.query.url;

    if (!videoURL) {
      return res.status(400).send('Missing video URL');
    }

    const info = await ytdl.getInfo(videoURL);
    const videoTitle = info.videoDetails.title;
    const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '') || 'video';

    let format;
    if (req.query.type === 'audio') {
      format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
    } else {
      format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
    }

    if (!format) {
      return res.status(404).send('No suitable format found');
    }

    const contentLength = format.contentLength;
    const contentType = format.mimeType;

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.${format.container}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength);

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
  //const title = info.videoDetails.title;

 // res.header("Content-Disposition", `attachment;  filename="vivek_masona"`);
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



app.get('/', (req: Request, res: Response) => {
  res.json({
    query: 'None'
  })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
