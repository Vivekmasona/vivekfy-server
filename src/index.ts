import express, { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

// Create an instance of Express and TelegramBot
const app = express();
const port = process.env.PORT || 3000;

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';
const bot = new TelegramBot(token);

app.use(express.json());

// Set the webhook URL
const webhookUrl = `https://vivekfy.vercel.app/telegram-webhook`;

// Function to set up the webhook with Telegram
async function setWebhook() {
  try {
    await bot.setWebHook(webhookUrl);
    console.log('Webhook is set up successfully.');
  } catch (error) {
    console.error('Failed to set up webhook:', error);
  }
}

// Call the function to set the webhook
setWebhook();

// Handle webhook updates from Telegram
app.post('/telegram-webhook', async (req: Request, res: Response) => {
  const update = req.body;
  console.log('Received update:', update);

  if (update.message) {
    const chatId = update.message.chat.id;
    const messageId = update.message.message_id;
    const text = update.message.text.trim();

    // Ignore messages that are commands (start with '/')
    if (text.startsWith('/')) return;

    // Check if the text is a URL
    const urlRegex = /https?:\/\/[^\s]+/;
    if (urlRegex.test(text)) {
      await bot.sendMessage(chatId, 'Processing your URL...');
      await bot.sendMessage(chatId, `Here is your URL: ${text}`);
      return;
    }

    // Otherwise, treat it as a song search query
    const songs = await searchSongs(text);
    if (songs.length > 0) {
      const foundMessage = await bot.sendMessage(chatId, `Found ${songs.length} songs. Sending the list...`);

      // Limit the number of songs sent to 5 to avoid overwhelming users
      const limitedSongs = songs.slice(0, 5);

      for (const song of limitedSongs) {
        const songUrl = song.downloadUrl[1]?.link;

        if (songUrl) {
          const songMessage = `
*${song.name}*
_${song.primaryArtists || 'Unknown Artist'}_
`;

          // Get audio stream
          const audioStream = await getStream(songUrl);

          if (audioStream) {
            // Send the poster with caption
            await bot.sendPhoto(chatId, song.image[2]?.link, {
              caption: songMessage,
              parse_mode: 'Markdown'
            });

            // Send the audio stream
            await bot.sendAudio(chatId, audioStream, {
              title: song.name,
              performer: song.primaryArtists || 'Unknown Artist'
            });
          } else {
            await bot.sendMessage(chatId, `Sorry, unable to stream the audio for the song: ${song.name}`);
          }
        } else {
          await bot.sendMessage(chatId, `Sorry, no downloadable URL found for the song: ${song.name}`);
        }
      }

      // Delete the "Found X songs. Sending the list..." message
      await bot.deleteMessage(chatId, foundMessage.message_id);
    } else {
      await bot.sendMessage(chatId, 'No songs found for your query.');
    }
  }

  res.sendStatus(200); // Acknowledge receipt of the update
});

// Function to search for songs
async function searchSongs(query: string) {
  try {
    const response = await axios.get(`https://svn-vivekfy.vercel.app/search/songs?query=${encodeURIComponent(query)}`);
    return response.data?.data?.results || [];
  } catch (error) {
    console.error('Error fetching song data:', error);
    return [];
  }
}

// Function to get the audio stream
async function getStream(url: string) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching audio stream:', error);
    return null;
  }
}

// Default route
app.get('/', (req: Request, res: Response) => {
  res.json({ query: 'None' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
