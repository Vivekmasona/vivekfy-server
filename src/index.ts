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


// Function to find U RL by itag in the nested JSON
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




app.get("/solve", async (req, res) => {
    const question = req.query.questions;

    if (!question) {
        return res.status(400).json({ error: "Please provide a valiquestion" });
    }

    try {
        // `eval` ka use sirf mathematical expressions ke liye ho raha hai
        const answer = eval(question);

        return res.json({ question, answer });
    } catch (error) {
        return res.status(400).json({ error: "Invalid mathematical expression" });
    }
});


app.get('/mp3', async (req, res) => {
    const { url, redirect } = req.query;

    // Validate URL
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    // Polling function to repeatedly fetch the URL until 'videoplayback' is found
    const fetchUntilPlayback = async () => {
        try {
            // Fetch the webpage HTML
            const response = await axios.get(url);
            const html = response.data;

            // Extract URLs from <source> tags
            const sourceLinks = [...html.matchAll(/<source[^>]+src="([^"]+)"/g)].map((match) => match[1]);

            // Extract URLs from <a> tags
            const hrefLinks = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);

            // Combine both arrays
            const allLinks = [...sourceLinks, ...hrefLinks];

            // Check if any link contains 'videoplayback'
            const playbackLink = allLinks.find(link => link.includes('videoplayback'));

            if (playbackLink) {
                // If found, redirect to the playback URL
                console.log('Playback URL found:', playbackLink);
                return res.redirect(playbackLink);
            } else {
                // If not found, wait for 3 seconds and try again
                console.log('Playback URL not found, retrying...');
                setTimeout(fetchUntilPlayback, 3000);
            }
        } catch (error) {
            console.error('Failed to fetch webpage:', error.message);
            // Retry after 3 seconds on error
            setTimeout(fetchUntilPlayback, 3000);
        }
    };

    // Start the polling
    fetchUntilPlayback();
});



app.get('/hack2', async (req, res) => {
    const { url, redirect } = req.query;

    // Validate URL
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    // Polling function to repeatedly fetch the URL until 'videoplayback' is found
    const fetchUntilPlayback = async () => {
        try {
            // Fetch the webpage HTML
            const response = await axios.get(url);
            const html = response.data;

            // Extract URLs from <source> tags
            const sourceLinks = [...html.matchAll(/<source[^>]+src="([^"]+)"/g)].map((match) => match[1]);

            // Extract URLs from <a> tags
            const hrefLinks = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);

            // Combine both arrays
            const allLinks = [...sourceLinks, ...hrefLinks];

            // Check if any link contains 'videoplayback'
            const playbackLink = allLinks.find(link => link.includes('videoplayback'));

            if (playbackLink) {
                // If found, send the playback link as response
                return res.send(`<pre>Playback URL Found:\n${playbackLink}</pre>`);
            } else {
                // If not found, wait for 3 seconds and try again
                console.log('Playback URL not found, retrying...');
                setTimeout(fetchUntilPlayback, 3000);
            }
        } catch (error) {
            console.error('Failed to fetch webpage:', error.message);
            // Retry after 3 seconds on error
            setTimeout(fetchUntilPlayback, 3000);
        }
    };

    // Start the polling
    fetchUntilPlayback();
});




app.get("/inv", async (req, res) => {
    const videoId = req.query.id;
    
    if (!videoId) {
        return res.status(400).json({ error: "YouTube video ID required" });
    }

    const apiUrl = `https://inv-cl1-c.nadeko.net/api/manifest/dash/id/${videoId}?local=true&unique_res=1&check=`;

    try {
        const response = await axios.get(apiUrl);
        const jsonData = response.data;

        if (jsonData) {
            // API response me se pehla `videoplayback` URL dhundhna
            const playbackUrl = Object.values(jsonData).find(url => 
                typeof url === "string" && url.includes("videoplayback")
            );

            if (playbackUrl) {
                return res.redirect(playbackUrl);
            }
        }

        return res.status(404).json({ error: "No videoplayback URL found" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch data", details: error.message });
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

app.get('/hack', async (req, res) => {
    const { url, redirect } = req.query;

    // Validate URL
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    try {
        // Fetch the webpage HTML
        const response = await axios.get(url);
        const html = response.data;

        // Extract URLs from <source> tags
        const sourceLinks = [...html.matchAll(/<source[^>]+src="([^"]+)"/g)].map((match) => match[1]);

        // Extract URLs from <a> tags
        const hrefLinks = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);

        // Combine both arrays
        const allLinks = [...sourceLinks, ...hrefLinks];

        // If the redirect parameter is provided, validate and redirect
        if (redirect) {
            const redirectIndex = parseInt(redirect, 10) - 1;

            // Check if the redirect index is valid
            if (redirectIndex >= 0 && redirectIndex < allLinks.length) {
                return res.redirect(allLinks[redirectIndex]);
            } else {
                return res.status(404).json({ error: 'Invalid redirect index' });
            }
        }

        // Format links in a numbered list
        const numberedLinks = allLinks.map((link, index) => `(${index + 1}) = ${link}`).join('\n');

        // Respond with the numbered list of links
        res.send(`<pre>${numberedLinks}</pre>`);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch webpage', details: error.message });
    }
});

app.get('/v3', async (req, res) => {  
    const { q } = req.query;  

    if (!q || typeof q !== 'string') {  
        return res.status(400).json({ error: 'Query parameter ?q is required' });  
    }  

    try {  
        const url = `https://clipzag.com/search?q=${encodeURIComponent(q)}`;  
        const response = await axios.get(url);  
        const html = response.data;  

        const matches = [...html.matchAll(/<a class='title-color' href='watch\?v=([^']+)'>[\s\S]*?<img .*?data-thumb='([^']+)'.*?>[\s\S]*?<div class='title-style' title='([^']+)'>(.*?)<\/div>[\s\S]*?<a class='by-user' href='\/channel\?id=([^']+)'>(.*?)<\/a>/g)];  

        const results = matches.map(match => ({  
            kind: "youtube#searchResult",
            etag: null,  
            id: {  
                kind: "youtube#video",
                videoId: match[1] || null  
            },  
            snippet: {  
                publishedAt: null,  
                channelId: match[4] || null,  
                title: match[3]?.trim() || null,  
                description: null,  
                thumbnails: {  
                    default: { url: `https:${match[2]}` || null },  
                    medium: { url: `https:${match[2]}` || null },  
                    high: { url: `https:${match[2]}` || null }  
                },  
                channelTitle: match[5]?.trim() || null,  
                liveBroadcastContent: "none"  
            }  
        }));  

        res.json({  
            kind: "youtube#searchListResponse",  
            etag: null,  
            nextPageToken: null,  
            prevPageToken: null,  
            regionCode: "IN",  
            pageInfo: {  
                totalResults: results.length,  
                resultsPerPage: results.length  
            },  
            items: results  
        });  

    } catch (error) {  
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });  
    }  
});

app.get('/self-api', async (req, res) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter ?q is required' });
    }

    try {
        // Clipzag se direct search query ka HTML fetch karna
        const url = `https://clipzag.com/search?q=${encodeURIComponent(q)}`;
        const response = await axios.get(url);
        const html = response.data;

        // Regex se YouTube video data extract karna
        const matches = [...html.matchAll(/<a class='title-color' href='watch\?v=([^']+)'>[\s\S]*?<img .*?data-thumb='([^']+)'.*?>[\s\S]*?<div class='title-style' title='([^']+)'>(.*?)<\/div>[\s\S]*?<a class='by-user' href='\/channel\?id=([^']+)'>(.*?)<\/a>/g)];

        const results = matches.map(match => ({
            id: `https://youtu.be/${match[1]}`,
            title: match[3].trim(),
            thumbnail: `https:${match[2]}`,
            channel_name: match[5].trim(),
            channel_id: match[4],
            channel_poster: `https://yt3.googleusercontent.com/ytc/${match[4]}`
        }));

        res.json({ query: q, results });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});


app.get('/streamm', async (req, res) => {
  const youtubeUrl = req.query.url; // Get YouTube URL from query parameter
  if (!youtubeUrl) {
    return res.status(400).send('Please provide a YouTube URL as a query parameter, e.g., ?url=https://www.youtube.com/watch?v=6RMENMtk3q4');
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `https://youtube-mp310.p.rapidapi.com/download/mp3`,
      params: { url: youtubeUrl },
      headers: {
        'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a',
        'x-rapidapi-host': 'youtube-mp310.p.rapidapi.com'
      }
    });

    const downloadUrl = response.data.downloadUrl;

    if (downloadUrl) {
      const audioBuffer = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'arraybuffer' // Fully buffer the audio
      });

      const bufferStream = new stream.PassThrough();
      bufferStream.end(Buffer.from(audioBuffer.data));

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.data.length
      });

      bufferStream.pipe(res); // Stream the buffered audio
    } else {
      res.status(500).send('Unable to retrieve download URL.');
    }
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});



app.get('/self', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    try {
        // Webpage HTML fetch karna
        const response = await axios.get(url);
        const html = response.data;

        // Regex se required data extract karna
        const matches = [...html.matchAll(/<a class='title-color' href='watch\?v=([^']+)'>[\s\S]*?<img .*?data-thumb='([^']+)'.*?>[\s\S]*?<div class='title-style' title='([^']+)'>(.*?)<\/div>[\s\S]*?<a class='by-user' href='\/channel\?id=([^']+)'>(.*?)<\/a>/g)];

        const results = matches.map(match => ({
            id: `https://youtu.be/${match[1]}`,
            title: match[3].trim(),
            thumbnail: `https:${match[2]}`,
            channel_name: match[5].trim(),
            channel_id: match[4],
            channel_poster: `https://yt3.googleusercontent.com/ytc/${match[4]}`
        }));

        res.json({ url, results });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch webpage', details: error.message });
    }
});



// API endpoint to extract links
app.get('/ex', async (req, res) => {
    const { url } = req.query;

    // Validate URL
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    try {
        // Fetch webpage HTML
        const response = await axios.get(url);
        const html = response.data;

        // Extract links using regex
        const links = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map(match => match[1]);

        // Respond with extracted links
        res.json({
            url,
            links,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch webpage', details: error.message });
    }
});

// API endpoint to extract links and full HTML source
app.get('/ext', async (req, res) => {
    const { url } = req.query;

    // Validate URL
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    try {
        // Fetch webpage HTML
        const response = await axios.get(url);
        const html = response.data;

        // Extract links using regex
        const links = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map(match => match[1]);

        // Respond with full HTML source and extracted links
        res.json({
            url,
            html, // Full source code of the webpage
            links, // Extracted links
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch webpage', details: error.message });
    }
});



 
   
const API_KEY = 'sk_3e56cc371edd52a93082ed6e63b0d57273bd84a78f6e3305';  // अपनी API Key डालें
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';  // कोई भी Voice ID डालें

app.get('/tts', async (req: Request, res: Response) => {
    const text: string | undefined = req.query.text as string;

    if (!text) {
        return res.status(400).send('Text query parameter is required');
    }

    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': API_KEY
                },
                responseType: 'arraybuffer'
            }
        );

        // Set headers for MP3 file response
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', response.data.length.toString());

        // Send MP3 audio response
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching TTS data:', error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});




app.get('/connect', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const apiUrl = `https://thirsty-editha-vivekfy-6cef7b64.koyeb.app/json?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        const audioUrl = response.data.url; // JSON me 'url' key me audio link hai

        if (!audioUrl) return res.status(404).json({ error: 'Audio URL not found' });

        res.redirect(audioUrl); // Redirect to audio URL
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
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
    const searchResponse = await axios.get(`https://inv.nadeko.net/api/v1/search`, {
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




// API route to get the playback URL
app.get('/playy', async (req, res) => {
  const youtubeUrl = req.query.url;

  if (!youtubeUrl) {
    return res.status(400).json({
      status: 'error',
      message: 'No URL provided. Use "?url=YOUTUBE_URL" in the query.',
    });
  }

  try {
    // yt-dlp options for extracting URL without downloading
    const options = ['-e', '--no-warnings', '--quiet', '--extract-audio', '--audio-quality', '0', youtubeUrl];

    // Execute the yt-dlp command
    ytDlp.exec(options).then(info => {
      const playbackUrl = info.url;

      // Return the response as JSON
      res.json({
        status: 'success',
        title: info.title,
        playback_url: playbackUrl
      });
    }).catch(err => {
      // If error occurs
      res.status(500).json({
        status: 'error',
        message: 'Could not retrieve playback URL',
        error: err.message
      });
    });
  } catch (err) {
    // General error handling
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
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




app.get('/api-play', async (req, res) => {
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
                'x-rapidapi-key': 'd113bf2857mshf1bf82bbecd02d8p1e9d1djsn2f5b44680886'
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








app.get('/stream', async (req, res) => {
  const youtubeUrl = req.query.url; // Get YouTube URL from query parameter
  if (!youtubeUrl) {
    return res.status(400).send('Please provide a YouTube URL as a query parameter, e.g., ?url=https://www.youtube.com/watch?v=phd1U2JIfUA');
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `https://youtube-mp310.p.rapidapi.com/download/mp3`,
      params: { url: youtubeUrl },
      headers: {
        'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a',
        'x-rapidapi-host': 'youtube-mp310.p.rapidapi.com'
      }
    });

    const downloadUrl = response.data.downloadUrl; // Extracting the 'downloadUrl' from JSON response
    
    if (downloadUrl) {
      res.redirect(downloadUrl); // Automatically redirect to the download URL
    } else {
      res.status(500).send('Unable to retrieve download URL from the response.');
    }
  } catch (error) {
    res.status(500).json({ error: error.response ? error.response.data : error.message });
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


app.get('/audio2', async (req, res) => {
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
        // Make request to the RapidAPI endpoint for video info
        const response = await axios.get(`https://youtube-video-info1.p.rapidapi.com/youtube-info`, {
            params: { url: `https://www.youtube.com/watch?v=${videoId}` },
            headers: {
                'x-rapidapi-host': 'youtube-video-info1.p.rapidapi.com',
                'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
            }
        });

        // Send the full JSON response back to the client
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching YouTube data:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});
     




app.get('/audio22', async (req, res) => {
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
        // Make request to the RapidAPI endpoint for video info
        const response = await axios.get(`https://youtube-video-info1.p.rapidapi.com/youtube-info`, {
            params: { url: `https://www.youtube.com/watch?v=${videoId}` },
            headers: {
                'x-rapidapi-host': 'youtube-video-info1.p.rapidapi.com',
                'x-rapidapi-key': '650590bd0fmshcf4139ece6a3f8ep145d16jsn955dc4e5fc9a'
            }
        });

        // Extract URLs into an array
        const urls = response.data.formats.map(format => format.url);

        // Send only the URLs back to the client
        res.json(urls);
    } catch (error) {
        console.error('Error fetching YouTube data:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});    
 

    
     



// List of servers to try
const servers = [
  //'https://inv-ca1-c.nadeko.net/latest_version?id={id}&itag=140&local=true',
  'https://inv-us2-c.nadeko.net/latest_version?id={id}&itag=140&check=local=true',
  'https://inv-eu2-c.nadeko.net/latest_version?id={id}&itag=140&check='
];

// Function to extract video ID from YouTube URL
const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

// Function to try servers one by one with the extracted ID
const getAudioStream = async (videoId: string): Promise<string | null> => {
  for (const serverTemplate of servers) {
    const server = serverTemplate.replace('{id}', videoId);
    try {
      const response: AxiosResponse = await axios.get(server, {
        maxRedirects: 0,  // Handle redirection manually
        validateStatus: status => status >= 200 && status < 400  // Ignore redirect status
      });
      if (response.status === 302 && response.headers.location) {
        return response.headers.location;  // Return redirect URL
      }
      return server;  // Return server URL if no redirection
    } catch (error) {
      console.error(`Failed to connect to server: ${server}`);
    }
  }
  return null;  // Return null if all servers fail
};

app.get('/backend', async (req: Request, res: Response) => {
  const youtubeUrl = req.query.url as string;
  const videoId = extractYouTubeId(youtubeUrl);

  if (!videoId) {
    return res.status(400).send('Invalid YouTube URL.');
  }

  const redirectUrl = await getAudioStream(videoId);
  if (redirectUrl) {
    res.redirect(redirectUrl);  // Redirect to the working server
  } else {
    res.status(500).send('All servers are currently unavailable.');
  }
});




// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for received data
let receivedData = [];

// Endpoint to receive and store data
app.get('/received', (req, res) => {
  try {
    const data = req.query.data; // Use 'data' instead of 'url' for flexibility

    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    // Save the data to the in-memory array
    const result = { data };
    receivedData.push(result); // Store the received data

    res.json(result); // Return the saved data
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process data: ' + error.message });
  }
});

// Endpoint to view all stored data
app.get('/print', (req, res) => {
  res.json(receivedData); // Return all stored data
});



app.get('/ocean', async (req, res) => {
    const ytUrl = req.query.vfy;

    if (ytUrl) {
        const proxyUrl = `https://vkrcors.vercel.app/proxy?proxyurl=https://p.oceansaver.in/ajax/download.php?copyright=0&format=mp3&url=${encodeURIComponent(ytUrl)}`;

        try {
            // Get the initial response from the proxy
            const response = await axios.get(proxyUrl);
            const data = response.data;

            if (data && data.id) {
                const progressApi = `https://p.oceansaver.in/ajax/progress.php?id=${data.id}`;

                // Check progress up to 10 times
                for (let i = 0; i < 10; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // wait 0.5 second

                    const progressResponse = await axios.get(progressApi);
                    const progressData = progressResponse.data;

                    if (progressData.progress === 1000 && progressData.download_url) {
                        // Redirect to the download URL
                        return res.redirect(progressData.download_url);
                    }
                }
            }

            // If the progress is not 1000 or download_url is not found
            res.status(404).send("Audio not found.");
        } catch (error) {
            console.error("Error during the API request:", error);
            // Return 500 internal server error if something goes wrong
            res.status(500).send("Internal server error. Please try again later.");
        }
    } else {
        res.status(400).send("No video URL provided.");
    }
});


  
    
  

// Base domain and subdomains
const baseDomain = 'nadeko.net';
const apiSubdomains = [
  'inv-eu2-c',
  'inv-us2-c',
  'inv-cl2-c:8443',
  'inv-ca1-c',
  'inv-eu3-c',
  'inv-cl1-c'
];

// Function to generate API URLs
const getApiUrls = (id) => {
    return apiSubdomains.map(subdomain => {
        if (subdomain.includes(':8443')) {
            return `https://${subdomain.split(':')[0]}.${baseDomain}:8443/latest_version?id=${encodeURIComponent(id)}&itag=250&local=true&check=`;
        }
        return `https://${subdomain}.${baseDomain}/latest_version?id=${encodeURIComponent(id)}&itag=250&local=true&check=`;
    });
};

// Route to get the final video URL and redirect
app.get('/vfy', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.redirect('https://www.youtube.com');
    }

    const apiUrls = getApiUrls(id);
    const timeout = 3000; // **3 seconds timeout**

    try {
        const responses = await Promise.any(apiUrls.map(apiUrl =>
            axios.get(apiUrl, {
                maxRedirects: 0,
                validateStatus: status => status >= 200 && status < 400,
                timeout: timeout // **Cancel request if it takes more than 3 seconds**
            }).then(response => response.headers.location)
        ));

        if (responses) {
            console.log(`Redirecting to: ${responses}`);
            return res.redirect(responses);
        }
    } catch (error) {
        console.error('All API requests failed:', error);
    }

    // If no API worked within the timeout, redirect to YouTube
    res.redirect('https://www.youtube.com');
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
     


