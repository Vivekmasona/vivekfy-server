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



app.get('/json', async (req, res) => {
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







app.get('/tts', async (req: Request, res: Response) => {
    const text: string | undefined = req.query.text as string;

    if (!text) {
        return res.status(400).send('Text query parameter is required');
    }

    try {
        const response = await axios.post(
            'https://joj-text-to-speech.p.rapidapi.com/',
            {
                input: {
                    text: text
                },
                voice: {
                    languageCode: 'hi',
                    name: 'en-US-News-L',
                    ssmlGender: 'FEMALE'
                },
                audioConfig: {
                    audioEncoding: 'MP3'
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': 'joj-text-to-speech.p.rapidapi.com',
                    'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
                }
            }
        );

        const base64Audio = response.data.audioContent;

        // Decode the base64-encoded audio content
        const audioBuffer = Buffer.from(base64Audio, 'base64');

        // Set the appropriate headers to serve the audio file
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length.toString());

        // Send the audio buffer as the response
        res.send(audioBuffer);
    } catch (error) {
        console.error('Error fetching TTS data:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});


app.get('/json2', async (req, res) => {
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
        const response = await axios.get('https://ytstream-download-youtube-videos.p.rapidapi.com/dl', {
            params: { id: videoId },
            headers: {
                'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com',
                'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching YouTube data:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});


app.get('/audio-dl', async (req, res) => {
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
        const response = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
            params: { id: videoId },
            headers: {
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
                'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
            }
        });

        // Assuming the response contains a field 'link' with the redirect URL
        const downloadUrl = response.data.link;

        if (downloadUrl) {
            res.redirect(downloadUrl);
        } else {
            res.status(500).send('Download URL not found in response');
        }
    } catch (error) {
        console.error('Error fetching YouTube data:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});


app.get('/cdn', async (req, res) => {
    const mediaUrl = req.query.url;

    if (!mediaUrl) {
        return res.status(400).send('URL parameter is required');
    }

    try {
        const response = await axios.post('https://all-media-downloader.p.rapidapi.com/download', 
            `-----011000010111000001101001\r\nContent-Disposition: form-data; name="url"\r\n\r\n${mediaUrl}\r\n-----011000010111000001101001--\r\n\r\n`, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data; boundary=---011000010111000001101001',
                    'x-rapidapi-host': 'all-media-downloader.p.rapidapi.com',
                    'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching media data:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});


// Route to search for videos
app.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    // Fetch search results from Invidious API
    const searchResponse = await axios.get(`https://invidious.jing.rocks/api/v1/search`, {
      params: { q: query }
    });
    res.json(searchResponse.data);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

// Route to fetch video details
app.get('/video/:id', async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    // Fetch video details from Invidious API
    const videoResponse = await axios.get(`https://invidious.jing.rocks/api/v1/videos/${id}`);
    const videoData = videoResponse.data;
    
    if (videoData) {
      const music = videoData.author.endsWith(' - Topic') ? '&w=720&h=720&fit=cover' : '';
      if (music) {
        videoData.author = videoData.author.replace(' - Topic', '');
      }
      const videoDetails = {
        author: videoData.author || 'Unknown Author',
        title: videoData.title || 'Unknown Title',
        thumbnail: `https://wsrv.nl?url=${encodeURIComponent(`https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`)}${music}`,
        audioUrl: `https://www.youtube.com/watch?v=${id}`
      };
      res.json(videoDetails);
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});





app.get('/download-v2', async (req, res) => {
    const mediaUrl = req.query.url;

    if (!mediaUrl) {
        return res.status(400).json({ error: 'URL parameter is missing.' });
    }

    const apiUrl = "https://all-media-downloader.p.rapidapi.com/download";
    
    const formData = `-----011000010111000001101001\r\nContent-Disposition: form-data; name="url"\r\n\r\n${mediaUrl}\r\n-----011000010111000001101001--\r\n\r\n`;

    try {
        const response = await axios.post(apiUrl, formData, {
            headers: {
                "Content-Type": "multipart/form-data; boundary=---011000010111000001101001",
                "x-rapidapi-host": "all-media-downloader.p.rapidapi.com",
                "x-rapidapi-key": "650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a"
            }
        });

        const data = response.data;

        const extractUrls = (obj) => {
            let urls = [];
            if (Array.isArray(obj)) {
                obj.forEach(item => {
                    urls = urls.concat(extractUrls(item));
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(value => {
                    urls = urls.concat(extractUrls(value));
                });
            } else if (typeof obj === 'string' && obj.startsWith('http')) {
                urls.push(obj);
            }
            return urls;
        };

        const urls = extractUrls(data);
        const totalUrls = urls.length;
        const index = req.query.index ? parseInt(req.query.index, 10) - 1 : null;

        if (index !== null) {
            if (index >= 0 && index < totalUrls) {
                return res.redirect(urls[index]);
            } else {
                return res.status(400).json({ error: 'Index out of bounds.', total_urls: totalUrls });
            }
        } else {
            if (urls.length > 0) {
                return res.json(urls);
            } else {
                return res.status(400).json({ error: 'No URLs found in the response.' });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});



// Endpoint to handle different platforms
app.get('/api', (req: Request, res: Response) => {
    const link: string = req.query.url ? sanitizeURL(req.query.url as string) : '';

    if (link) {
        let serverLink: string;

        if (link.includes('youtu.be') || link.includes('youtube.com')) {
            serverLink = `https://vivekfy.vercel.app/download?index=22&url=${link}`;
        } else if (link.includes('facebook.com')) {
            serverLink = `https://vivekfy.vercel.app/savevideo?url=${link}`;
        } else if (link.includes('instagram.com')) {
            serverLink = `https://vivekfy.fanclub.rocks/api?url=${link}`;
        } else if (link.includes('twitter.com') || link.includes('x.com')) {
            serverLink = `https://vivekfy.vercel.app/download-v2?index=2&url=${link}`;
        } else if (link.includes('pinterest.com') || link.includes('pin.it')) {
            serverLink = `https://vivekfy.vercel.app/savevideo?url=${link}`;
        } else if (link.includes('vimeo.com')) {
            serverLink = `https://vivekfy.vercel.app/savevideo?url=${link}`;
        } else if (link.includes('dailymotion.com') || link.includes('dai.ly')) {
            serverLink = `https://vivekfy.vercel.app/savevideo?url=${link}`;
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


app.get('/download', async (req, res) => {
    const mediaUrl = req.query.url;
    if (!mediaUrl) {
        return res.status(400).json({ error: 'URL parameter is missing.' });
    }

    const apiUrl = `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(mediaUrl)}`;
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
                "x-rapidapi-key": "650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a"
            }
        });

        const data = response.data;

        const extractUrls = (obj) => {
            let urls = [];
            if (Array.isArray(obj)) {
                obj.forEach(item => {
                    urls = urls.concat(extractUrls(item));
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(value => {
                    urls = urls.concat(extractUrls(value));
                });
            } else if (typeof obj === 'string' && obj.startsWith('http')) {
                urls.push(obj);
            }
            return urls;
        };

        const urls = extractUrls(data);
        const totalUrls = urls.length;
        const index = req.query.index ? parseInt(req.query.index, 10) - 1 : null;

        if (index !== null) {
            if (index >= 0 && index < totalUrls) {
                return res.redirect(urls[index]);
            } else {
                return res.status(400).json({ error: 'Index out of bounds.', total_urls: totalUrls });
            }
        } else {
            if (urls.length > 0) {
                return res.json(urls);
            } else {
                return res.status(400).json({ error: 'No URLs found in the response.' });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});



// Route for streaming YouTube audio in OPUS format via a third-party API
app.get('/stream', async (req: Request, res: Response) => {
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
      isAudioOnly: true,  // Set to true to indicate audio-only
      aFormat: 'opus',   // Set format to OPUS
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    const result = response.data;
    res.redirect(result.url); // Redirect to the stream URL
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to stream audio: ' + error.message });
  }
});


app.get('/stream2', async (req: Request, res: Response) => {
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
    // Fetching stream URL from Cobalt.tools API
    const response = await axios.post(provider, {
      url: streamUrl,
      isAudioOnly: true,  // Set to true to indicate audio-only
      aFormat: 'opus',   // Set format to OPUS
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    const result = response.data;
    const audioStreamUrl = result.url;

    // Extract thumbnail URL and channel name (if provided in response)
    const thumbnailUrl = result.thumbnail; // Assuming response has thumbnail URL
    const channelName = result.channel; // Assuming response has channel name

    // Embed thumbnail and metadata into the audio file (This is a placeholder, actual implementation will vary)
    const ffmpegCommand = `ffmpeg -i "${audioStreamUrl}" -i "${thumbnailUrl}" -map 0:a -map 1 -c copy -metadata artist="${channelName}" -id3v2_version 3 output_with_metadata.opus`;

    // Here you should run the ffmpeg command using a child process (this is just a sample command)
    // Once the ffmpeg processing is done, serve the file
    res.redirect(audioStreamUrl); // Redirect to the processed stream URL with embedded metadata

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to stream audio: ' + error.message });
  }
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


const CARTESIA_API_KEY = 'e1dadf99-c903-4da2-bc1a-1f4c069d8bd3'; // Updated API key
const VOICE_ID = 'cd17ff2d-5ea4-4695-be8f-42193949b946'; // Your Voice ID

app.get('/tts/v2', async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  try {
    const response = await axios.post(
      'https://api.cartesia.ai/tts/bytes',
      {
        model_id: 'sonic-english',
        transcript: text,
        voice: {
          mode: 'id',
          id: VOICE_ID,
        },
        output_format: {
          container: 'wav', 
          encoding: 'pcm_s16le', // 16-bit PCM encoding for lower quality
          sample_rate: 16000, // Lower sample rate for reduced quality and file size
        },
      },
      {
        headers: {
          'Cartesia-Version': '2024-06-30',
          'Content-Type': 'application/json',
          'X-API-Key': CARTESIA_API_KEY,
        },
        responseType: 'stream',
      }
    );

    // Set headers for file download
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="vivek_masona_ai.wav"');

    // Pipe the audio stream directly to the client for instant download
    response.data.pipe(res);
  } catch (error) {
    console.error('Error generating TTS:', error.response?.data || error.message);
    res.status(500).json({ error: 'Voice synthesis failed' });
  }
});


const API_KEY = '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'; // Replace with your actual API key
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'; // Replace with the actual Esme API endpoint

// Endpoint to handle AI questions via GET request
app.get('/ai', async (req, res) => {
    const question = req.query.questions;
    if (!question) {
        return res.status(400).send('questions parameter is required');
    }

    try {
        // Send the question to the AI model
        const response = await axios.post(API_URL, {
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: question }],
            max_tokens: 200,
            temperature: 0.7,
            top_p: 1,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const botReply = response.data.choices[0].message.content.trim();

        // Convert AI response text to TTS
        const audioUrl = googleTTS.getAudioUrl(botReply, {
            lang: 'hi', // Hindi language code
            slow: false,
            host: 'https://translate.google.com',
        });

        // Redirect to TTS audio URL
        res.redirect(audioUrl);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});



// Function to extract video ID from YouTube URL
const extractVideoId = (url) => {
    let videoId = null;

    // Match for youtube.com/watch?v= format
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^\&\?\/]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
        videoId = youtubeMatch[1];
    }

    // Match for youtu.be/ format
    if (!videoId) {
        const youtuBeRegex = /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\&\?\/]+)/;
        const youtuBeMatch = url.match(youtuBeRegex);
        if (youtuBeMatch && youtuBeMatch[1]) {
            videoId = youtuBeMatch[1];
        }
    }

    return videoId;
};

app.get('/vivekfy', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send('Error: No URL provided.');
    }

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
        return res.status(400).send('Error: Invalid YouTube URL.');
    }

    const apiUrl = `https://invidious.privacyredirect.com/api/v1/videos/${videoId}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Extract adaptive format URL
        const adaptiveFormats = data.adaptiveFormats || [];
        let audioUrl = '';

        for (const format of adaptiveFormats) {
            if (format.url) {
                audioUrl = format.url;
                break;
            }
        }

        if (audioUrl) {
            return res.redirect(audioUrl);
        } else {
            return res.status(404).send('No adaptive format URL found');
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
        return res.status(500).send('Error fetching video details.');
    }
});

app.get('/vivekfy2', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send('Error: No URL provided.');
    }

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
        return res.status(400).send('Error: Invalid YouTube URL.');
    }

    const apiUrl = `https://inv.tux.pizza/api/v1/videos/${videoId}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Extract adaptive format URL
        const adaptiveFormats = data.adaptiveFormats || [];
        let audioUrl = '';

        for (const format of adaptiveFormats) {
            if (format.url) {
                audioUrl = format.url;
                break;
            }
        }

        if (audioUrl) {
            return res.redirect(audioUrl);
        } else {
            return res.status(404).send('No adaptive format URL found');
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
        return res.status(500).send('Error fetching video details.');
    }
});


// Endpoint to handle Facebook URLs
app.get('/api/fb', async (req, res) => {
    try {
        const { video } = req.query;

        // Check if the video query parameter is provided
        if (!video) {
            return res.status(400).json({ error: 'Please provide a video query parameter' });
        }

        // Facebook API URL
        const apiUrl = `https://vivekfy-all-api.vercel.app/api/fb?video=${encodeURIComponent(video)}`;

        // Fetch the JSON response from the Facebook API
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data) {
            if (data.hd) {
                res.redirect(data.hd);  // Redirect to the HD URL if available
            } else if (data.sd) {
                res.redirect(data.sd);  // Redirect to the SD URL if HD is not available
            } else {
                res.status(400).json({ error: 'No video URL found in the response' });
            }
        } else {
            res.status(400).json({ error: 'Invalid response from Facebook API' });
        }
    } catch (error) {
        console.error('Error fetching Facebook video data:', error);
        res.status(500).json({ error: 'Failed to fetch data from the Facebook API' });
    }
});

// Endpoint to handle Instagram URLs
app.get('/api/ig', async (req, res) => {
    try {
        const { video } = req.query;

        // Check if the video query parameter is provided
        if (!video) {
            return res.status(400).json({ error: 'Please provide a video query parameter' });
        }

        // Instagram API URL
        const apiUrl = `https://vivekfy.vercel.app/api/insta?link=${encodeURIComponent(video)}`;

        // Fetch the JSON response from the Instagram API
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data) {
            if (data.hd) {
                res.redirect(data.hd);  // Redirect to the HD URL if available
            } else if (data.sd) {
                res.redirect(data.sd);  // Redirect to the SD URL if HD is not available
            } else {
                res.status(400).json({ error: 'No video URL found in the response' });
            }
        } else {
            res.status(400).json({ error: 'Invalid response from Instagram API' });
        }
    } catch (error) {
        console.error('Error fetching Instagram video data:', error);
        res.status(500).json({ error: 'Failed to fetch data from the Instagram API' });
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
     

