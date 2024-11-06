class AuthManager {
    static init() {
        const authButton = document.getElementById('spotify-auth');
        if (authButton) {
            authButton.addEventListener('click', () => this.authorize());
        }
        
        // 檢查 URL 是否包含授權碼
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            this.handleCallback(accessToken);
        }
    }
    
    static authorize() {
        const params = new URLSearchParams({
            client_id: SPOTIFY_CONFIG.clientId,
            response_type: 'token',
            redirect_uri: SPOTIFY_CONFIG.redirectUri,
            scope: SPOTIFY_CONFIG.scopes.join(' '),
            show_dialog: true
        });

        window.location.href = `${SPOTIFY_CONFIG.authEndpoint}?${params.toString()}`;
    }
    
    static handleCallback(accessToken) {
        if (accessToken) {
            TokenManager.setToken(accessToken);
            // 清除 URL 中的 hash
            window.location.hash = '';
            // 重新載入頁面
            window.location.reload();
        }
    }

    static handleError(error) {
        console.error('Spotify 授權錯誤：', error);
        // 清除過期的 token
        TokenManager.removeToken();
        // 顯示錯誤訊息
        alert('Spotify 授權已過期，請重新登入');
        // 重新導向到登入頁面
        window.location.href = '/';
    }
}

const TokenManager = {
    setToken(token) {
        localStorage.setItem('spotify_token', token);
        localStorage.setItem('token_timestamp', Date.now());
    },
    
    getToken() {
        const token = localStorage.getItem('spotify_token');
        const timestamp = localStorage.getItem('token_timestamp');
        
        if (token && timestamp) {
            const now = Date.now();
            const hoursPassed = (now - parseInt(timestamp)) / (1000 * 60 * 60);
            
            if (hoursPassed > 1) {
                this.removeToken();
                return null;
            }
        }
        
        return token;
    },
    
    removeToken() {
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('token_timestamp');
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});
