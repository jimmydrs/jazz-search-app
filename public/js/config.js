// 初始化設定物件
window.config = {
    spotify: {
        clientId: null,
        redirectUri: null
    }
};

// 建立一個 Promise 來處理設定載入
window.configLoaded = new Promise((resolve, reject) => {
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            window.config.spotify = data.spotify;
            console.log('設定檔已載入');
            resolve(data);
        })
        .catch(error => {
            console.error('載入設定檔時發生錯誤:', error);
            reject(error);
        });
});

// 提供一個檢查設定是否已載入的函數
window.isConfigLoaded = () => {
    return window.config && 
           window.config.spotify && 
           window.config.spotify.clientId && 
           window.config.spotify.redirectUri;
};
