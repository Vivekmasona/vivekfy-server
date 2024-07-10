import express from 'express'
import ytdl from 'ytdl-core'
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

app.get('/play/:url', async (req: Request, res: Response) => {
  const urlParam = req.params.url
  const url = `https://www.youtube.com/watch?v=${urlParam}`
  try {
    const info = await ytdl.getInfo(url as string)
    const audioFormat = ytdl.filterFormats(info.formats, 'audioonly').find(format => format.audioCodec === 'opus' && format.audioQuality === 'AUDIO_QUALITY_LOW')

    if (!audioFormat) {
      throw new Error('No suitable audio format found')
    }

    const audioUrl = audioFormat.url

    // Directly redirect to the audio playback URL
    res.redirect(audioUrl)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get audio URL!' })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
