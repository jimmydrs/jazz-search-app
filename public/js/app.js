console.log('app.js 載入中...');

// 等待應用程式準備就緒
window.addEventListener('appReady', () => {
    console.log('初始化搜尋功能...');
    
    // 獲取 DOM 元素
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    const spotifyResultsDiv = document.getElementById('spotify-results');
    const youtubeResultsDiv = document.getElementById('youtube-results');

    // 檢查元素是否存在
    if (!searchInput || !searchButton || !spotifyResultsDiv || !youtubeResultsDiv) {
        console.error('搜尋元素未找到:', {
            searchInput: !!searchInput,
            searchButton: !!searchButton,
            spotifyResultsDiv: !!spotifyResultsDiv,
            youtubeResultsDiv: !!youtubeResultsDiv
        });
        return;
    }

    console.log('搜尋元素已找到，綁定事件...');

    // 搜尋功能
    async function performSearch() {
        try {
            const query = searchInput.value.trim();
            if (!query) {
                showError('請輸入搜尋關鍵字');
                return;
            }

            console.log('執行搜尋:', query);

            // 顯示載入中狀態
            spotifyResultsDiv.innerHTML = '<div class="loading">搜尋中...</div>';
            youtubeResultsDiv.innerHTML = '<div class="loading">搜尋中...</div>';

            // 同時發送 Spotify 和 YouTube 搜尋請求
            const [spotifyResponse, youtubeResponse] = await Promise.all([
                fetch(`/api/search/spotify?q=${encodeURIComponent(query)}`),
                fetch(`/api/search/youtube?q=${encodeURIComponent(query)}`)
            ]);

            if (!spotifyResponse.ok || !youtubeResponse.ok) {
                throw new Error('搜尋請求失敗');
            }

            const spotifyData = await spotifyResponse.json();
            const youtubeData = await youtubeResponse.json();

            // 顯示搜尋結果
            displaySpotifyResults(spotifyData.tracks?.items || []);
            displayYouTubeResults(youtubeData.items || []);

        } catch (error) {
            console.error('搜尋錯誤:', error);
            showError('搜尋時發生錯誤: ' + error.message);
            spotifyResultsDiv.innerHTML = '<div class="error">搜尋失敗</div>';
            youtubeResultsDiv.innerHTML = '<div class="error">搜尋失敗</div>';
        }
    }

    // 錯誤提示函數
    function showError(message) {
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
        setTimeout(() => errorDiv.remove(), 3000);
    }

    // 綁定搜尋事件
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});

// 顯示 Spotify 搜尋結果
function displaySpotifyResults(tracks) {
    const spotifyResultsDiv = document.getElementById('spotify-results');
    
    if (!tracks.length) {
        spotifyResultsDiv.innerHTML = '<div class="no-results">沒有找到相關歌曲</div>';
        return;
    }

    const resultsHtml = tracks.map(track => `
        <div class="result-card">
            <div class="result-thumbnail-container">
                <img class="result-thumbnail" 
                     src="${track.album.images[0]?.url || 'default-album.png'}" 
                     alt="${track.name}">
                <a href="${track.external_urls.spotify}" 
                   class="thumbnail-play-btn" 
                   target="_blank" 
                   title="在 Spotify 中開啟">
                    <i class="fas fa-play"></i>
                </a>
            </div>
            <div class="result-content">
                <div class="result-info">
                    <h3 class="result-title">${track.name}</h3>
                    <div class="result-meta">
                        <span class="result-artist">${track.artists.map(artist => artist.name).join(', ')}</span>
                        <span class="result-album">${track.album.name}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="add-to-playlist-btn" 
                            onclick="addSpotifyToPlaylist('${track.id}', '${track.name.replace(/'/g, "\\'")}', '${track.artists[0].name.replace(/'/g, "\\'")}', '${track.album.images[0]?.url}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    spotifyResultsDiv.innerHTML = resultsHtml;
}

// 顯示 YouTube 搜尋結果
function displayYouTubeResults(videos) {
    const container = document.getElementById('youtube-results');
    
    if (!videos.length) {
        container.innerHTML = '<div class="no-results">沒有找到相關影片</div>';
        return;
    }

    const html = videos.map(video => {
        const videoId = video.id.videoId;
        const title = video.snippet.title.replace(/'/g, "\\'");
        const channelTitle = video.snippet.channelTitle.replace(/'/g, "\\'");
        const thumbnail = video.snippet.thumbnails.medium.url;
        
        return `
            <div class="result-card">
                <div class="thumbnail">
                    <img src="${thumbnail}" alt="${title}">
                </div>
                <div class="info">
                    <h3>${title}</h3>
                    <p>${channelTitle}</p>
                </div>
                <div class="actions">
                    <button class="add-to-playlist-btn" 
                            onclick="addYouTubeToPlaylist('${videoId}', '${title}', '${channelTitle}', '${thumbnail}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}
