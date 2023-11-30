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