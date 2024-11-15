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
            serverLink = `https://vivekfy.vercel.app/savevideo?url=${link}`;
        } else if (link.includes('facebook.com')) {
            serverLink = `https://vivekfy.vercel.app/savevideo?url=${link}`;
        } else if (link.includes('instagram.com')) {
            serverLink = `https://vivekfy.vercel.app/api/ig?url=${link}`;
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

app.get('/audio-download', async (req: Request, res: Response) => {
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
      isAudioOnly: true,  // Ensure it's audio-only
      aFormat: 'm4a',     // Set format to M4A
      quality: 'low',     // Ensure the lowest quality is selected
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    const result = response.data;
    res.redirect(result.url); // Redirect to the stream URL for M4A
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to stream audio: ' + error.message });
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

// Route for downloading YouTube audio in the smallest possible WEBM format
app.get('/webm', async (req: Request, res: Response) => {
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
      aFormat: 'webm',    // Set format to WEBM
      aQuality: 'lowest', // Attempt to get the lowest quality
      filenamePattern: 'basic'
    }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    });

    const result = response.data;
    const downloadUrl = result.url;

    // Redirect to the download URL
    res.redirect(downloadUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download audio: ' + error.message });
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

    const apiUrl = `https://inv.nadeko.net/api/v1/videos/${videoId}`;

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

    const apiUrl = `https://invidious.nerdvpn.de/api/v1/videos/${videoId}`;

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

app.get('/vivekfy3', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send('Error: No URL provided.');
    }

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
        return res.status(400).send('Error: Invalid YouTube URL.');
    }

    const apiUrl = `https://eu-proxy.poketube.fun/api/v1/videos/${videoId}`;

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


app.get('/vivekfy4', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send('Error: No URL provided.');
    }

    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
        return res.status(400).send('Error: Invalid YouTube URL.');
    }

    const apiUrl = `https://just4cats.tv/api/v1/videos/${videoId}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Extract adaptive format URL
        const adaptiveFormats = data.adaptiveFormats || [];
        let audioUrl = '';
        let foundFirstUrl = false;  // To track the first found URL

        for (const format of adaptiveFormats) {
            if (format.url) {
                if (foundFirstUrl) {
                    // Found the second URL, use it
                    audioUrl = format.url;
                    break;
                } else {
                    // Skip the first URL and set the flag to true
                    foundFirstUrl = true;
                }
            }
        }

        if (audioUrl) {
            return res.redirect(audioUrl);
        } else {
            return res.status(404).send('No second adaptive format URL found');
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
        return res.status(500).send('Error fetching video details.');
    }
});





app.get('/meta', async (req, res) => {
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
            const result = {
                audioUrl: audioUrl,
                thumbnail: data.videoThumbnails ? data.videoThumbnails[0].url : null, // Get the first available thumbnail
                title: data.title || 'Unknown Title', // Video title or default
                artist: 'vivekmasona' // Fixed artist name
            };
            return res.json(result);
        } else {
            return res.status(404).send('No adaptive format URL found');
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
        return res.status(500).send('Error fetching video details.');
    }
});






app.get('/meta2', async (req, res) => {
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
            const result = {
                audioUrl: audioUrl,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // Fixed thumbnail URL format
                title: data.title || 'Unknown Title', // Video title or default
                artist: 'vivekmasona' // Fixed artist name
            };
            return res.json(result);
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
        const { url } = req.query;

        // Check if the url query parameter is provided
        if (!url) {
            return res.status(400).json({ error: 'Please provide a url query parameter' });
        }

        // Instagram API URL with the provided URL parameter
        const apiUrl = `https://vivekfy-all-api.vercel.app/api/insta?link=${encodeURIComponent(url)}`;

        // Fetch the JSON response from the Instagram API
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data && data.data && data.data.length > 0) {
            // Extract the video URL from the JSON response
            const videoUrl = data.data[0].url; // Assuming the first item in the array is the required video URL

            if (videoUrl) {
                // Redirect to the video URL
                return res.redirect(videoUrl);
            } else {
                return res.status(400).json({ error: 'No video URL found in the response' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid response from Instagram API' });
        }
    } catch (error) {
        console.error('Error fetching Instagram video data:', error);
        res.status(500).json({ error: 'Failed to fetch data from the Instagram API' });
    }
});

// Endpoint to get video details
app.get('/deno', async (req, res) => {
  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId query parameter is required' });
  }

  try {
    // Use the new API URL with the videoId parameter
    const response = await axios.get(`https://vivekfy.deno.dev/video?id=${videoId}`);
    
    // Fetch title from the response of your API
    const { title } = response.data;

    // Create the "mqdefault" thumbnail URL
    const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    res.json({
      artist: 'VivekMasona', // Fixed artist name
      title: title,          // Use title from your API's JSON response
      thumbnail: thumbnail   // Generate thumbnail URL
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});


// Endpoint to get video details
app.get('/yt', async (req, res) => {
  const videoId = req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId query parameter is required' });
  }

  try {
    const response = await axios.get(`https://inv.tux.pizza/api/v1/videos/${videoId}`);
    
    const { title } = response.data;

    // Create the "mqdefault" thumbnail URL
    const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    res.json({
      artist: 'VivekMasona', // Fixed artist name
      title: title,
      thumbnail: thumbnail
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

app.get('/vid', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        return res.status(400).json({ error: 'Please provide a YouTube video ID' });
    }

    try {
        // Fetch video details from your Deno API
        const apiUrl = `https://vivekfy.deno.dev/video?id=${videoId}`;
        const response = await axios.get(apiUrl);

        // Extract the title from the video data
        const { title } = response.data.video;

        // Construct the thumbnail URL using the videoId and 'mqdefault'
        const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        // Set a fixed artist name
        const artist = 'vivekmasona';

        // Send the response as JSON
        res.json({
            title: title,
            artist: artist,
            thumbnail: thumbnail
        });

    } catch (error) {
        console.error('Error fetching video details:', error.message);
        res.status(500).json({ error: 'Failed to fetch video details' });
    }
});


app.get('/vid2', async (req, res) => {
    const videoId = req.query.id;

    if (!videoId) {
        return res.status(400).json({ error: 'Please provide a YouTube video ID' });
    }

    try {
        // Fetch video details from your Deno API
        const apiUrl = `https://vivekfy.deno.dev/video?id=${videoId}`;
        const response = await axios.get(apiUrl);

        // Extract the title from the video data
        const { title } = response.data.video;

        // Construct the thumbnail URLs using the videoId
        const thumbnail1 = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const thumbnail2 = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        // Set a fixed artist name
        const artist = 'vivekmasona';

        // Watermark audio URL
        const watermarkAudio = 'https://github.com/Vivekmasona/dav12/raw/refs/heads/main/watermark.mp3';

        // Send the response as JSON
        res.json({
            title: title,
            artist: artist,
            thumbnails: {
                maxres: thumbnail1,
                hqdefault: thumbnail2,
            },
            watermark: {
                audio: watermarkAudio,
            },
        });

    } catch (error) {
        console.error('Error fetching video details:', error.message);
        res.status(500).json({ error: 'Failed to fetch video details' });
    }
});


app.get('/dl/poster', async (req, res) => {
    const youtubeUrl = req.query.url;

    if (!youtubeUrl) {
        return res.status(400).send('URL parameter is required');
    }

    const videoIdMatch = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const coverUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const coverResponse = await axios.get(coverUrl, { responseType: 'arraybuffer' });

        const coverFileName = `${videoId}_cover.jpg`;

        res.setHeader('Content-Disposition', `attachment; filename="${coverFileName}"`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(coverResponse.data);
        
    } catch (error) {
        console.error('Error fetching poster image:', error.message);
        res.status(error.response ? error.response.status : 500).send('An error occurred.');
    }
});

app.get('/saver', async (req, res) => {
    const videoUrl = req.query.vkr;

    if (!videoUrl) {
        res.status(400).send("No video URL provided.");
        return;
    }

    const format = 'mp3';
    const initialApiUrl = `https://ab.cococococ.com/ajax/download.php?format=${format}&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
    const progressApiUrl = 'https://p.oceansaver.in/ajax/progress.php?id=';

    try {
        // Step 1: Start conversion and get the ID
        const initialResponse = await axios.get(initialApiUrl);
        const initialData = initialResponse.data;

        if (!initialData || !initialData.success || !initialData.id) {
            res.status(500).send("Failed to start MP3 conversion.");
            return;
        }

        const id = initialData.id;
        let downloadUrl = null;
        const sleepDuration = 3000; // 3 seconds

        // Step 2: Poll for the download URL until conversion completes
        while (true) {
            const progressResponse = await axios.get(`${progressApiUrl}${id}`);
            const progressData = progressResponse.data;

            if (progressData.download_url) {
                downloadUrl = progressData.download_url;
                break; // Exit loop once URL is ready
            }

            if (progressData.progress < 1000) {
                await new Promise(resolve => setTimeout(resolve, sleepDuration));
            } else {
                await new Promise(resolve => setTimeout(resolve, sleepDuration));
            }
        }

        // Step 3: Stream the MP3 file directly for download
        if (downloadUrl) {
            res.setHeader('Content-Disposition', 'attachment; filename="download.mp3"');
            axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream',
            }).then(response => {
                response.data.pipe(res);
            }).catch(error => {
                res.status(500).send("Error downloading MP3 file.");
            });
        } else {
            res.status(500).send("Conversion failed or no download URL available.");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred.");
    }
});

app.get('/getlink', (req, res) => {
    const videoUrl = req.query.vkr;

    if (!videoUrl) {
        res.status(400).send("No video URL provided.");
        return;
    }

    // Generate a unique download URL for the client
    const downloadLink = `${req.protocol}://${req.get('host')}/start_download?vkr=${encodeURIComponent(videoUrl)}`;
    res.json({ downloadLink });
});

app.get('/getdl', async (req, res) => {
    const videoUrl = req.query.vkr;
    const format = 'mp3';
    const initialApiUrl = `https://ab.cococococ.com/ajax/download.php?format=${format}&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
    const progressApiUrl = 'https://p.oceansaver.in/ajax/progress.php?id=';
    let downloadUrl = null;
    const sleepDuration = 3000;

    try {
        // Step 1: Initiate conversion
        const initialResponse = await axios.get(initialApiUrl);
        const initialData = initialResponse.data;

        if (!initialData || !initialData.success || !initialData.id) {
            res.status(500).send("Failed to start MP3 conversion.");
            return;
        }

        const id = initialData.id;

        // Step 2: Poll progress until completion
        while (true) {
            const progressResponse = await axios.get(`${progressApiUrl}${id}`);
            const progressData = progressResponse.data;

            if (progressData.getdl) {
                downloadUrl = progressData.getdl;
                break;
            }

            if (progressData.progress < 1000) {
                await new Promise(resolve => setTimeout(resolve, sleepDuration));
            } else {
                await new Promise(resolve => setTimeout(resolve, sleepDuration));
            }
        }

        // Step 3: Redirect to download URL once ready
        if (downloadUrl) {
            res.redirect(downloadUrl);
        } else {
            res.status(500).send("Conversion failed or no download URL available.");
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred.");
    }
});


app.get('/ocean', async (req, res) => {
    const videoUrl = req.query.vfy;
    if (!videoUrl) {
        res.status(400).send('No video URL provided');
        return;
    }

    const format = 'mp3';
    const initialApiUrl = `https://ab.cococococ.com/ajax/download.php?format=${format}&url=${encodeURIComponent(videoUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
    const progressApiUrl = 'https://p.oceansaver.in/ajax/progress.php?id=';

    try {
        // Step 1: Start the download and get the ID
        const initialResponse = await axios.get(initialApiUrl);
        const initialData = initialResponse.data;

        if (!initialData || !initialData.success || !initialData.id) {
            res.status(500).send('Failed to start download process');
            return;
        }

        const id = initialData.id;
        let retryCount = 0;
        const retryLimit = 10;
        let downloadUrl = null;

        // Step 2: Check download progress and get the final download URL
        while (retryCount < retryLimit) {
            const progressResponse = await axios.get(progressApiUrl + id);
            const progressData = progressResponse.data;

            if (progressData.download_url) {
                downloadUrl = progressData.download_url;
                break;
            }

            if (progressData.progress && progressData.progress < 1000) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
            } else {
                break;
            }
        }

        if (downloadUrl) {
            // Redirect to the download URL
            res.redirect(downloadUrl);
        } else {
            res.status(500).send('Download URL not available after conversion');
        }
    } catch (error) {
        res.status(500).send('An error occurred');
    }
});






// Endpoint to handle requests to /json2
app.get('/vivekapi', async (req, res) => {
    const targetUrl = req.query.vfy;
    const redirectIndex = parseInt(req.query.redirect);

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const apiUrl = `https://vkrdownloader.xyz/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(targetUrl)}`;

    try {
        // Make the API request
        const response = await axios.get(apiUrl);
        const jsonData = response.data;

        console.log('API Response:', JSON.stringify(jsonData, null, 2)); // Log the API response

        // Function to validate URL
        const isValidUrl = (url) => {
            const regex = /^(ftp|http|https):\/\/[^ "]+$/;
            return regex.test(url);
        };

        // Function to extract URLs from JSON data
        const extractUrls = (data) => {
            const urls = [];
            const recursiveSearch = (obj) => {
                if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        const value = obj[key];
                        if (Array.isArray(value)) {
                            value.forEach(item => recursiveSearch(item));
                        } else if (typeof value === 'string' && isValidUrl(value)) {
                            urls.push(value);
                        } else if (typeof value === 'object') {
                            recursiveSearch(value); // Recurse into nested objects
                        }
                    }
                }
            };
            recursiveSearch(data);
            return urls;
        };

        // Extract URLs from the JSON response
        const urls = extractUrls(jsonData);

        console.log('Extracted URLs:', urls); // Log extracted URLs

        if (redirectIndex && urls[redirectIndex - 1]) {
            // Redirect to the URL at the specified index
            console.log(`Redirecting to: ${urls[redirectIndex - 1]}`);
            return res.redirect(urls[redirectIndex - 1]);
        } else {
            // Output the URLs if redirect is not requested
            res.setHeader('Content-Type', 'text/plain');
            if (urls.length > 0) {
                urls.forEach((url, index) => {
                    res.write(`(${index + 1}) ${url}\n`);
                });
                res.end();
            } else {
                res.send("No URLs found in the response.");
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Error fetching data: ' + error.message });
    }
});




// Endpoint to handle requests to /json2
app.get('/vivekdl', async (req, res) => {
    const targetUrl = req.query.vfy;
    const redirectIndex = parseInt(req.query.redirect);

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    const apiUrl = `https://vkrdownloader.xyz/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(targetUrl)}`;

    try {
        // Make the API request
        const response = await axios.get(apiUrl);
        const jsonData = response.data;

        console.log('API Response:', JSON.stringify(jsonData, null, 2)); // Log the API response

        // Function to validate URL
        const isValidUrl = (url) => {
            const regex = /^(ftp|http|https):\/\/[^ "]+$/;
            return regex.test(url);
        };

        // Function to extract URLs and title from JSON data
        const extractUrlsAndTitle = (data) => {
            const urls = [];
            let title = '';
            const recursiveSearch = (obj) => {
                if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        const value = obj[key];
                        if (key === 'title' && typeof value === 'string') {
                            title = value; // Fetch the title
                        }
                        if (Array.isArray(value)) {
                            value.forEach(item => recursiveSearch(item));
                        } else if (typeof value === 'string' && isValidUrl(value)) {
                            urls.push(value);
                        } else if (typeof value === 'object') {
                            recursiveSearch(value); // Recurse into nested objects
                        }
                    }
                }
            };
            recursiveSearch(data);
            return { urls, title };
        };

        // Extract URLs and title from the JSON response
        const { urls, title } = extractUrlsAndTitle(jsonData);

        console.log('Extracted URLs:', urls); // Log extracted URLs

        if (redirectIndex && urls[redirectIndex - 1]) {
            // Download the URL at the specified index
            const downloadUrl = urls[redirectIndex - 1];
            console.log(`Downloading from: ${downloadUrl}`);

            // Set headers for downloading the file
            const sanitizedTitle = title.replace(/[<>:"/\\|?*]+/g, ''); // Sanitize the title for file naming
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle || 'download'}.mp4"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            // Stream the file from the download URL
            const downloadResponse = await axios.get(downloadUrl, { responseType: 'stream' });
            downloadResponse.data.pipe(res);
        } else {
            // Output the URLs if redirect is not requested
            res.setHeader('Content-Type', 'text/plain');
            if (urls.length > 0) {
                urls.forEach((url, index) => {
                    res.write(`(${index + 1}) ${url}\n`);
                });
                res.end();
            } else {
                res.send("No URLs found in the response.");
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Error fetching data: ' + error.message });
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
     

