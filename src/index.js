const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual bot token
const token = '6679345669:AAELrij30jh93yVhnI-yzqf2krf4QVHCdSs';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Welcome message for new users
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    const welcomeMessage = `
    Hello👋 ${firstName} 🥰babu

    WELCOME🙏TO VIVEKFY🎧AI BOT!🤖
    
    Please enter a 🎧song name or 
    enter a YouTube, Instagram, or Facebook 🔗URL to download or play audio/video
    `;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle regular messages (not commands)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore messages that are commands (start with '/')
    if (text.startsWith('/')) return;

    // Regular expression patterns for URL detection
    const youtubeUrlPattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([^"&?\/\s]{11}))/;
    const instaUrlPattern = /https:\/\/www\.instagram\.com\/reel\/\S+/;
    const fbUrlPattern = /https:\/\/www\.facebook\.com\/(?:reel|share\/v|share|watch|story)\/\S+/;

    if (youtubeUrlPattern.test(text)) {
        // Handle YouTube URL
        const youtubeUrl = text.match(youtubeUrlPattern)[0];
        const videoId = text.match(youtubeUrlPattern)[2]; // Extract the YouTube video ID from the URL

        try {
            // Fetch data from the API
            const apiUrl = `https://vivekfy.vercel.app/hack?url=${encodeURIComponent(youtubeUrl)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            // Extract relevant information for YouTube URL case
            const title = data.title;
            const thumbnailUrl = data.thumbnail;
            const audioUrl = data.audioFormats[0].url; // Assuming first audio format
            const downloadUrl = `https://vivekfy.fanclub.rocks?url=${youtubeUrl}`;

            // Create a message with thumbnail, title, play audio link, and download link
            const message = `
                [Thumbnail](${thumbnailUrl})
                
                *${title}*
                
            `;

            // Send the message with buttons
            bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Play Audio', url: audioUrl }],
                        [{ text: 'Download', url: downloadUrl }],
                        [{ text: 'Thumbnail', url: thumbnailUrl }]
                    ]
                }
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
        }
    } else if (instaUrlPattern.test(text)) {
        // Handle Instagram URL
        try {
            const instaUrl = text.match(instaUrlPattern)[0];
            const apiUrl = `https://vivekfy-all-api.vercel.app/api/insta?link=${encodeURIComponent(instaUrl)}`;
            const response = await axios.get(apiUrl);
            const data = response.data.data[0];

            const thumbnailUrl = data.thumbnail;
            const videoUrl = data.url;

            // Create a message with thumbnail and download button
            const message = `
                [Thumbnail](${thumbnailUrl})
                
                *Download the Instagram video below:*
            `;

            bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Download', url: videoUrl }]
                    ]
                }
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
        }
    } else if (fbUrlPattern.test(text)) {
        // Handle Facebook URL
        try {
            const fbUrl = text.match(fbUrlPattern)[0];
            const apiUrl = `https://vivekfy-all-api.vercel.app/api/fb?video=${encodeURIComponent(fbUrl)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            const videoUrl = data.sd || data.hd; // Use SD if HD is not available
            const thumbnailUrl = data.thumbnail;

            // Send the video directly to the chat
            bot.sendVideo(chatId, videoUrl, { caption: `[Thumbnail](${thumbnailUrl})` });

        } catch (error) {
            console.error('Error fetching data:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
        }
    } else {
        // Assume it's a song name search
        try {
            // Fetch data from the song search API
            const apiSearchUrl = `https://recondite-paint-warlock.glitch.me?name=${encodeURIComponent(text)}`;
            const response = await axios.get(apiSearchUrl);
            const data = response.data;

            if (data.length === 0) {
                bot.sendMessage(chatId, 'No results found for your search.');
                return;
            }

            // Send each search result in a separate message
            data.forEach((item) => {
                const message = `
                    [Thumbnail](${item.thumbnailUrl})
                    
                    *${item.title}*
                    Artist: ${item.artist}
                `;

                bot.sendMessage(chatId, message, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Play Audio', url: item.downloadUrl }],
                            [{ text: 'Download', url: item.downloadUrl }],
                            [{ text: 'Thumbnail', url: item.thumbnailUrl }]
                        ]
                    }
                });
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
        }
    }
});
