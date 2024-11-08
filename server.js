require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const fs = require('fs').promises;
const os = require('os');
const cors = require('cors');
const SpotifyAuth = require('./server/spotifyAuth');

// 引入必要的模組
const dotenv = require('dotenv');

// 載入環境變數
dotenv.config();

// 驗證環境變數
console.log('正在驗證環境變數...');
const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        console.error(`錯誤: 缺少環境變數 ${varName}`);
        process.exit(1);
    }
}

// 建立 Express 應用程式
const port = process.env.PORT || 3000;

// 輸出環境變數檢查
console.log('環境變數檢查：', {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? '已設置' : '未設置',
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? '已設置' : '未設置',
    PORT: process.env.PORT
});

// 使用中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 在 app.use 之前添加安全標頭
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Spotify token 管理
let spotifyToken = null;

// 取得 Spotify Token
async function getSpotifyToken() {
    try {
        console.log('開始取得 Spotify Token...');
        
        // 建立授權標頭
        const auth = Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64');
        
        console.log('發送 Token 請求...');
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: 'grant_type=client_credentials'
        });

        console.log('收到回應，狀態碼:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token 請求失敗. 回應內容:', errorText);
            throw new Error(`Token 請求失敗: ${response.status}`);
        }

        const data = await response.json();
        console.log('成功解析回應數據');
        
        if (!data.access_token) {
            console.error('回應中沒有 access_token:', data);
            throw new Error('無效的回應數據');
        }

        console.log('成功獲取 Token');
        return data.access_token;

    } catch (error) {
        console.error('Token 獲取過程中發生錯誤:', error);
        throw error;
    }
}

// API 路由
app.get('/api/test', (req, res) => {
    res.json({ message: 'API 測試成功' });
});

// Spotify 搜尋邏輯優化
app.get('/api/search/spotify', async (req, res) => {
    try {
        if (!spotifyToken) {
            spotifyToken = await getSpotifyToken();
        }

        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: '搜尋關鍵字不能為空' });
        }

        // 搜尋參數
        const searchParams = new URLSearchParams({
            q: query,
            type: 'track',
            market: 'TW',
            limit: 50
        });

        const response = await fetch(
            `https://api.spotify.com/v1/search?${searchParams}`,
            {
                headers: {
                    'Authorization': `Bearer ${spotifyToken}`
                }
            }
        );

        const data = await response.json();
        
        // 優化的相關性排序邏輯
        const sortedTracks = data.tracks.items.map(track => {
            let relevanceScore = 0;
            const searchTerms = query.toLowerCase().split(' ');
            const titleLower = track.name.toLowerCase();
            const artistNames = track.artists.map(a => a.name.toLowerCase());
            const albumName = track.album.name.toLowerCase();
            
            // 1. 標題完全匹配（最高優先）
            if (titleLower === query.toLowerCase()) {
                relevanceScore += 1000;
            }

            // 2. 標題開頭匹配
            if (titleLower.startsWith(query.toLowerCase())) {
                relevanceScore += 500;
            }

            // 3. 標題包含完整搜尋詞
            if (titleLower.includes(query.toLowerCase())) {
                relevanceScore += 300;
            }

            // 4. 搜尋詞分詞匹配
            searchTerms.forEach(term => {
                // 標題中的分詞匹配
                if (titleLower.includes(term)) {
                    relevanceScore += 100;
                }
                
                // 藝人名稱匹配
                if (artistNames.some(name => name.includes(term))) {
                    relevanceScore += 50;
                }
            });

            // 5. 降低特定類型音樂的排名
            const lowerPriorityKeywords = [
                'classical', 'orchestra', 'symphony', 'concerto', 
                'sonata', 'quartet', 'classical piano', 'opera',
                'baroque', 'chamber music'
            ];

            // 檢查標題、藝人名稱和專輯名稱
            if (lowerPriorityKeywords.some(keyword => 
                titleLower.includes(keyword) || 
                artistNames.some(name => name.includes(keyword)) ||
                albumName.includes(keyword)
            )) {
                relevanceScore -= 200;
            }

            // 6. 提升爵士相關音樂的排名
            const jazzKeywords = [
                'jazz', 'blues', 'swing', 'bebop', 'fusion',
                'improvisation', 'trio', 'quartet', 'quintet'
            ];

            if (jazzKeywords.some(keyword => 
                titleLower.includes(keyword) || 
                artistNames.some(name => name.includes(keyword)) ||
                albumName.includes(keyword)
            )) {
                relevanceScore += 100;
            }

            return {
                ...track,
                relevanceScore
            };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 20)
        .map(({ relevanceScore, ...track }) => track);

        res.json({ tracks: { ...data.tracks, items: sortedTracks } });

    } catch (error) {
        console.error('搜尋錯誤:', error);
        res.status(500).json({ error: '搜尋失敗', message: error.message });
    }
});

// YouTube 搜尋 API
app.get('/api/search/youtube', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: '搜尋關鍵字不能為空' });
        }

        console.log('執行 YouTube 搜尋:', query);

        const searchParams = new URLSearchParams({
            part: 'snippet',
            q: `${query} jazz`,
            type: 'video',
            maxResults: 20,
            key: process.env.YOUTUBE_API_KEY
        });

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${searchParams}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('YouTube API 錯誤:', errorText);
            throw new Error(`YouTube API 錯誤: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('YouTube 搜尋錯��:', error);
        res.status(500).json({ 
            error: '搜尋失敗',
            message: error.message 
        });
    }
});

// 使用環境變數來設定重定向 URI
const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/callback.html';

app.get('/api/config', (req, res) => {
    res.json({
        spotify: {
            clientId: process.env.SPOTIFY_CLIENT_ID,
            redirectUri: redirectUri
        }
    });
});

// 提供靜態檔案
app.use(express.static('public'));

// 啟動伺服器
app.listen(port, async () => {
    console.log(`伺服器運行於 http://localhost:${port}`);
    try {
        console.log('正在初始化 Spotify Token...');
        spotifyToken = await getSpotifyToken();
        console.log('伺服器初始化完成！');
    } catch (error) {
        console.error('伺服器初始化失敗:', error);
        // 不要結束程序，讓它繼續運行並在需要時重試
        console.log('將在請求時重試獲取 Token');
    }
});

app.post('/api/auth/spotify/callback', async (req, res) => {
    const { code } = req.body;
    
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
                ).toString('base64')
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: 'http://localhost:3000/callback.html',
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        res.json({
            success: true,
            access_token: data.access_token,
            refresh_token: data.refresh_token
        });
    } catch (error) {
        console.error('Token 交換失敗:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 在現有的 server.js 中加入
const configRoutes = require('./server/routes/config');
app.use(configRoutes);

