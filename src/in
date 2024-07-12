import express from 'express'
import ytdl from 'ytdl-core'
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

app.get('/audio/:url', async (req: Request, res: Response) => {
  const urlParam = req.params.url
  const url = `https://www.youtube.com/watch?v=${urlParam}`
  try {
    const info = await ytdl.getInfo(url as string)
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })

    const audioUrl = audioFormat.url

    res.redirect(audioUrl)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get audio URL!' })
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



app.get('/video/:url', async (req: Request, res: Response) => {
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

app.get('/videoinfo/:url', async (req: Request, res: Response) => {
  try {
    const urlParam = req.params.url
    const url = `https://www.youtube.com/watch?v=${urlParam}`

    const info = await ytdl.getInfo(url)

    res.json({
      author: info.videoDetails.author,
      title: info.videoDetails.title,
      views: info.videoDetails.viewCount,
      thumbnail: info.videoDetails.thumbnails
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch video information' })
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
