import express, { Request, Response } from 'express';
import ytdl from 'ytdl-core';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';
const bot = new TelegramBot(token, { polling: true });

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

// Function to find URL by itag in the nested JSON
function findUrlByItag(data: any, itag: number): string | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.itag === itag && item.url) {
        return item.url;
      }
      // Recursively search in nested arrays
      const result = findUrlByItag(item, itag);
      if (result) {
        return result;
      }
    }
  } else if (typeof data === 'object') {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const result = findUrlByItag(data[key], itag);
        if (result) {
          return result;
        }
      }
    }
  }
  return null;
}

// Route to handle redirection or JSON response
app.get('/audio', async (req: Request, res: Response) => {
  const videoUrl = req.query.url as string;
  const itag = req.query.itag as string;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Please provide a YouTube video URL as a parameter (e.g., ?url=ytlink).' });
  }

  try {
    // Fetch JSON data from the API
    const response = await axios.get(`https://vivekfy.vercel.app/json?url=${encodeURIComponent(videoUrl)}`);
    const info = response.data;

    if (itag) {
      // Convert itag to a number and validate
      const itagNumber = parseInt(itag, 10);
      if (!isNaN(itagNumber)) {
        // Find the URL by itag
        const mediaUrl = findUrlByItag(info, itagNumber);
        if (mediaUrl) {
          console.log(`Redirecting to URL: ${mediaUrl}`); // Debugging
          return res.redirect(mediaUrl);
        } else {
          return res.status(404).json({ error: 'Media format with the specified itag not found.' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid itag format.' });
      }
    } else {
      // Return the full JSON response if no itag is specified
      return res.json(info);
    }
  } catch (error) {
    console.error('Error fetching video info:', error); // Debugging
    return res.status(500).json({ error: 'An error occurred while fetching video info.' });
  }
});

// Route to handle YouTube JSON API
app.get('/json', async (req: Request, res: Response) => {
  const youtubeUrl = req.query.url;
  if (!youtubeUrl) {
    return res.status(400).send('URL parameter is required');
  }

  // Extract video ID from YouTube URL
  const videoIdMatch = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) {
    return res.status(400).send('Invalid YouTube URL');
  }

  try {
    const response = await axios.get('https://yt-api.p.rapidapi.com/dl', {
      params: { id: videoId },
      headers: {
        'x-rapidapi-host': 'yt-api.p.rapidapi.com',
        'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).send(error.message);
  }
});

// Telegram bot code
// Welcome message for new users
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const welcomeMessage = `
Hello👋 ${firstName} 🥰babu

WELCOME🙏TO VIVEKFY🎧AI BOT!🤖

Please enter a🎧song name 
     `;
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle song search queries
async function searchSongs(query: string) {
  try {
    const response = await axios.get(`https://svn-vivekfy.vercel.app/search/songs?query=${encodeURIComponent(query)}`);
    return response.data?.data?.results || [];
  } catch (error) {
    console.error('Error fetching song data:', error);
    return [];
  }
}

// Get audio stream
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

// Handle regular messages (not commands)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  const text = msg.text.trim();

  // Ignore messages that are commands (start with '/')
  if (text.startsWith('/')) return;

  // Check if the text is a URL
  const urlRegex = /https?:\/\/[^\s]+/;
  if (urlRegex.test(text)) {
    bot.sendMessage(chatId, 'Processing your URL...');

    // Example: Send the URL as a response
    bot.sendMessage(chatId, `Here is your URL: ${text}`);
    return;
  }

  // Delete the user's query message
  await bot.deleteMessage(chatId, messageId);

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
          bot.sendMessage(chatId, `Sorry, unable to stream the audio for the song: ${song.name}`);
        }
      } else {
        bot.sendMessage(chatId, `Sorry, no downloadable URL found for the song: ${song.name}`);
      }
    }

    // Delete the "Found X songs. Sending the list..." message
    await bot.deleteMessage(chatId, foundMessage.message_id);
  } else {
    bot.sendMessage(chatId, 'No songs found for your query.');
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
