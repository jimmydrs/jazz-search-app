document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const spotifyResultsDiv = document.getElementById('spotify-results');
    const youtubeResultsDiv = document.getElementById('youtube-results');
    const loader = document.querySelector('.loader');
    let isLoading = false;

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query || isLoading) return;

        isLoading = true;
        loader.style.display = 'block';
        spotifyResultsDiv.innerHTML = '';
        youtubeResultsDiv.innerHTML = '';

        try {
            const [spotifyTracks, youtubeVideos] = await Promise.all([
                searchTracks(query),
                YouTubeAPI.search(query)
            ]);

            // 過濾並排序結果
            const filteredTracks = filterRelevantTracks(spotifyTracks, query);
            
            // 顯示結果
            displayResults(filteredTracks);
            displayYouTubeResults(youtubeVideos);

        } catch (error) {
            console.error('搜尋錯誤：', error);
            spotifyResultsDiv.innerHTML = `<div class="error">搜尋時發生錯誤：${error.message}</div>`;
            youtubeResultsDiv.innerHTML = '';
        } finally {
            loader.style.display = 'none';
            isLoading = false;
        }
    }

    async function searchTracks(query) {
        const token = TokenManager.getToken();
        if (!token) {
            throw new Error('請先登入 Spotify');
        }

        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                TokenManager.removeToken();
                throw new Error('Spotify 授權已過期，請重新登入');
            }
            throw new Error('Spotify 搜尋失敗');
        }

        const data = await response.json();
        return data.tracks.items;
    }

    function filterRelevantTracks(tracks, query) {
        return tracks
            .map(track => {
                const relevanceScore = calculateRelevanceScore(track, query);
                return { track, relevanceScore };
            })
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10)
            .map(item => item.track);
    }

    function calculateRelevanceScore(track, query) {
        const title = track.name.toLowerCase();
        const artist = track.artists[0].name.toLowerCase();
        const searchTerms = query.toLowerCase().split(' ');
        let score = 0;

        // 檢查標題完全匹配
        if (title === query.toLowerCase()) {
            score += 10;
        }

        // 檢查藝術家完全匹配
        if (artist === query.toLowerCase()) {
            score += 8;
        }

        // 檢查部分匹配
        searchTerms.forEach(term => {
            if (title.includes(term)) score += 3;
            if (artist.includes(term)) score += 2;
        });

        // 降低古典樂的分數
        const classicalKeywords = ['symphony', 'concerto', 'sonata', 'classical', 'orchestra'];
        classicalKeywords.forEach(keyword => {
            if (title.includes(keyword) || artist.includes(keyword)) {
                score -= 5;
            }
        });

        return score;
    }

    function displayResults(tracks) {
        spotifyResultsDiv.innerHTML = tracks.map(track => `
            <div class="track-card">
                <img class="track-image" src="${track.album.images[0]?.url || 'placeholder.jpg'}" alt="${track.name}">
                <div class="track-info">
                    <h3 class="track-name">${track.name}</h3>
                    <p class="artist-name">${track.artists[0].name}</p>
                    <div class="track-actions">
                        <a class="spotify-link" href="${track.external_urls.spotify}" target="_blank">Open in Spotify</a>
                        <button class="preview-button" 
                            onclick="playPreview('${track.preview_url}')"
                            ${!track.preview_url ? 'disabled' : ''}>
                            ${track.preview_url ? 'Preview' : 'No Preview'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function displayYouTubeResults(videos) {
        youtubeResultsDiv.innerHTML = videos.map(video => `
            <div class="youtube-card">
                <img class="youtube-thumbnail" src="${video.thumbnail}" alt="${video.title}">
                <div class="youtube-info">
                    <h3 class="youtube-title">${video.title}</h3>
                    <p class="youtube-channel">${video.channelTitle}</p>
                    <div class="track-actions">
                        <a class="spotify-link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank">
                            Watch on YouTube
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 音樂預覽功能
    window.playPreview = (function() {
        let audio = null;
        
        return function(url) {
            if (!url) return;
            
            if (audio) {
                audio.pause();
                audio = null;
            }
            
            audio = new Audio(url);
            audio.play();
        };
    })();
});
