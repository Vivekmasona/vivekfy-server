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
    const query: string | undefined = req.query.query as string;

    if (!query) {
        return res.status(400).send('Query parameter is required');
    }

    try {
        const response = await axios.post(
            'https://open-ai-text-to-speech1.p.rapidapi.com/',
            {
                model: 'tts-1',
                input: query,
                voice: 'nova'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': 'open-ai-text-to-speech1.p.rapidapi.com',
                    'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
                },
                responseType: 'arraybuffer' // Ensure the response is treated as binary data
            }
        );

        const audioData = response.data;

        // Set the appropriate headers to serve the audio file
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioData);
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
            serverLink = `https://vivekfy.vercel.app/download?index=8&url=${link}`;
        } else if (link.includes('instagram.com')) {
            serverLink = `https://vivekfy.vercel.app/download?index=4&url=${link}`;
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


// Endpoint to handle AI questions via GET request
app.get('/ai', async (req, res) => {
    const userQuestion = req.query.questions;
    const API_KEY = 'AIzaSyAMcFfiJw8hR-aAtjbAXUODVCoeq_hqCbE'; // Replace with your actual API key
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

    if (!userQuestion) {
        return res.status(400).send('Missing "questions" query parameter.');
    }

    try {
        // Send the question to the AI model
        const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
            contents: [{ role: 'user', parts: [{ text: userQuestion }] }],
            generationConfig: {
                temperature: 1,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 8192,
            },
        });

        const botReply = response.data.candidates[0].content.parts[0].text;

        // Redirect to TTS API
        res.redirect(`https://vivekfy.vercel.app/tts?query=${encodeURIComponent(botReply)}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Sorry, I encountered an error. Please try again.');
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
     

