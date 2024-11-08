const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 管理員認證中間件
const adminAuth = async (req, res, next) => {
    try {
        const token = req.cookies.admin_token;
        if (!token) {
            return res.status(401).json({ error: '未登入' });
        }

        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: '認證失敗' });
    }
};

// 管理員登入
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 這裡應該從數據庫驗證管理員帳號
        if (username === process.env.ADMIN_USERNAME && 
            password === process.env.ADMIN_PASSWORD) {
            
            const token = jwt.sign(
                { username, role: 'admin' },
                process.env.ADMIN_JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.cookie('admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24小時
            });

            res.json({ success: true });
        } else {
            res.status(401).json({ error: '帳號或密碼錯誤' });
        }
    } catch (error) {
        res.status(500).json({ error: '登入失敗' });
    }
});

// 檢查管理員狀態
router.get('/auth', adminAuth, (req, res) => {
    res.json({ 
        isAdmin: true,
        username: req.admin.username
    });
});

// 管理員登出
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
});

// 獲取監控數據
router.get('/monitoring', adminAuth, async (req, res) => {
    try {
        // 這裡獲取實際的監控數據
        const monitoringData = {
            uptime: process.uptime(),
            systemResources: {
                memory: {
                    used: process.memoryUsage().heapUsed,
                    total: process.memoryUsage().heapTotal
                },
                cpu: [process.cpuUsage().user / 1000000]
            },
            // ... 其他監控數據
        };
        
        res.json(monitoringData);
    } catch (error) {
        res.status(500).json({ error: '獲取監控數據失敗' });
    }
});

module.exports = router; 