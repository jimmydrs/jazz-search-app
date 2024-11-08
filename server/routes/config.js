const express = require('express');
const router = express.Router();

router.get('/api/config', (req, res) => {
    res.json({
        spotify: {
            clientId: process.env.SPOTIFY_CLIENT_ID,
            redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/callback.html'
        }
    });
});

module.exports = router; 