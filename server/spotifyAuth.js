const fetch = require('node-fetch');

class SpotifyAuth {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token = null;
        this.tokenExpiry = null;
    }

    async getValidToken() {
        // 檢查是否需要更新 token
        if (!this.token || this.isTokenExpired()) {
            console.log('需要更新 Token...');
            await this.refreshToken();
        }
        return this.token;
    }

    isTokenExpired() {
        return !this.tokenExpiry || Date.now() >= this.tokenExpiry;
    }

    async refreshToken() {
        try {
            console.log('開始更新 Token...');
            console.log('使用的憑證:', {
                clientId: this.clientId ? '已設置' : '未設置',
                clientSecret: this.clientSecret ? '已設置' : '未設置'
            });

            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(
                        `${this.clientId}:${this.clientSecret}`
                    ).toString('base64')
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token 請求失敗: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            this.token = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 提前一分鐘更新
            console.log('Token 更新成功！');
            
        } catch (error) {
            console.error('更新 Token 失敗:', error);
            throw error;
        }
    }
}

module.exports = SpotifyAuth;
