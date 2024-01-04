const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/rapid', async (req, res) => {
    const { id } = req.query;
    const apiKey = '11939ea42cmsh9be181f6708fc39p162794jsn9e46f87d898b';
    const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${id}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
