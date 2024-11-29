const express = require('express');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const app = express();

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

        const downloadUrl = response.data.link;
        const originalTitle = response.data.title;

        if (!downloadUrl) {
            return res.status(500).send('Download URL not found in response');
        }

        // Define file paths
        const tempDir = '/tmp'; // Use /tmp for temporary files
        const inputAudioPath = path.join(tempDir, `${originalTitle}.mp3`);
        const outputAudioPath = path.join(tempDir, `${originalTitle}_with_watermark.mp3`);
        const watermarkAudioUrl = 'https://github.com/Vivekmasona/dav12/raw/refs/heads/main/watermark.mp3';
        const watermarkAudioPath = path.join(tempDir, 'watermark.mp3');

        // Download watermark audio if not already downloaded
        if (!fs.existsSync(watermarkAudioPath)) {
            const watermarkResponse = await axios.get(watermarkAudioUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(watermarkAudioPath);
            watermarkResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }

        // Download the YouTube audio
        const audioResponse = await axios.get(downloadUrl, { responseType: 'stream' });
        const audioWriter = fs.createWriteStream(inputAudioPath);
        audioResponse.data.pipe(audioWriter);

        await new Promise((resolve, reject) => {
            audioWriter.on('finish', resolve);
            audioWriter.on('error', reject);
        });

        // Merge the watermark with the YouTube audio
        ffmpeg()
            .input(watermarkAudioPath)
            .input(inputAudioPath)
            .complexFilter([
                '[0:a]apad=pad_dur=10[aud1]', // Extend watermark audio to 10 seconds
                '[aud1][1:a]concat=n=2:v=0:a=1[out]' // Concatenate watermark and main audio
            ])
            .outputOptions('-map [out]')
            .save(outputAudioPath)
            .on('end', () => {
                res.download(outputAudioPath, `${originalTitle}_with_watermark.mp3`, () => {
                    // Clean up files
                    fs.unlinkSync(inputAudioPath);
                    fs.unlinkSync(outputAudioPath);
                });
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err.message);
                res.status(500).send('Error processing audio');
            });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
