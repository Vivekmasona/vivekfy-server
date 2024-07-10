import express from 'express'
import ytdl from 'ytdl-core'
import TelegramBot from 'node-telegram-bot-api'
import { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3000

const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs'
const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const urlParam = match[1]
  const url = `https://www.youtube.com/watch?v=${urlParam}`
  
  try {
    const info = await ytdl.getInfo(url as string)
    const audioFormat = ytdl.filterFormats(info.formats, 'audioonly').find(format => format.audioCodec === 'opus' && format.audioQuality === 'AUDIO_QUALITY_LOW')

    if (!audioFormat) {
      throw new Error('No suitable audio format found')
    }

    const audioUrl = audioFormat.url
    await bot.sendMessage(chatId, `Direct audio URL: ${audioUrl}`)
  } catch (err) {
    console.error(err)
    await bot.sendMessage(chatId, 'Failed to get audio URL!')
  }
})

app.get('/', (req: Request, res: Response) => {
  res.send('Telegram bot is running')
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
