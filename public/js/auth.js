class SpotifyAuth {
    constructor() {
        if (!window.configLoaded) {
            throw new Error('設定檔載入 Promise 未定義');
        }

        return this.initializeAuth();
    }

    async initializeAuth() {
        try {
            await window.configLoaded;
            
            if (!window.isConfigLoaded()) {
                throw new Error('設定檔未完全載入');
            }
            
            this.clientId = window.config.spotify.clientId;
            this.redirectUri = window.config.spotify.redirectUri;
            
            this.setupLoginButton();
            this.checkLoginStatus();
            
            console.log('SpotifyAuth 初始化成功');
            return this;
        } catch (error) {
            console.error('SpotifyAuth 初始化失敗:', error);
            this.showError('初始化失敗，請重新整理頁面');
            throw error;
        }
    }

    setupLoginButton() {
        const loginButton = document.getElementById('spotify-login');
        if (!loginButton) {
            console.error('找不到 Spotify 登入按鈕 (id: spotify-login)');
            return;
        }

        console.log('找到登入按鈕，設定事件監聽器');
        
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('登入按鈕被點擊');
            try {
                this.handleLogin();
            } catch (error) {
                console.error('Spotify 登入過程發生錯誤:', error);
                this.showError('登入過程發生錯誤，請稍後再試');
            }
        });
    }

    handleLogin() {
        if (!this.clientId) {
            this.showError('Spotify Client ID 未設定');
            return;
        }

        console.log('開始登入流程...');

        // 生成並儲存 state 用於安全驗證
        const state = this.generateRandomString(16);
        localStorage.setItem('spotify_auth_state', state);

        const scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email';
        
        const args = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            scope: scope,
            redirect_uri: this.redirectUri,
            state: state,
            show_dialog: true
        });

        const authUrl = 'https://accounts.spotify.com/authorize?' + args;
        console.log('重定向到:', authUrl);
        window.location = authUrl;
    }

    checkLoginStatus() {
        // 檢查 URL 中是否有錯誤訊息
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error) {
            this.showError(decodeURIComponent(error));
            // 清除 URL 中的錯誤參數
            window.history.replaceState({}, document.title, '/');
        }

        // 檢查是否已登入
        const token = localStorage.getItem('spotify_access_token');
        const loginButton = document.getElementById('spotify-login');
        
        if (token && loginButton) {
            loginButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> 登出 Spotify';
            loginButton.addEventListener('click', () => this.handleLogout());
        }
    }

    handleLogout() {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_auth_state');
        window.location.reload();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

// 確保 SpotifyAuth 類別可以被全域存取
window.SpotifyAuth = SpotifyAuth;