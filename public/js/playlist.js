console.log('playlist.js 載入成功');

class Playlist {
    constructor() {
        this.playlists = {};
        this.loadFromLocalStorage();
        console.log('Playlist 初始化完成', this.playlists);
    }

    createPlaylist(name) {
        console.log('開始建立播放清單:', name);
        
        if (!name) {
            console.error('播放清單名稱不能為空');
            return false;
        }
        
        const playlistId = 'playlist_' + Date.now();
        this.playlists[playlistId] = {
            id: playlistId,
            name: name,
            tracks: [],
            createdAt: new Date().toISOString()
        };
        
        console.log('播放清單建立成功:', this.playlists[playlistId]);
        this.saveToLocalStorage();
        this.updateDisplay();
        return playlistId;
    }

    addTrack(playlistId, track) {
        console.log('準備添加曲目到播放清單:', { playlistId, track });
        
        if (typeof playlistId !== 'string') {
            console.error('無效的播放清單 ID:', playlistId);
            return false;
        }

        if (!this.playlists[playlistId]) {
            console.error('播放清單不存在:', playlistId);
            return false;
        }

        const normalizedTrack = {
            id: track.id,
            title: track.title,
            artist: track.artist,
            image: track.image,
            source: track.source,
            addedAt: new Date().toISOString()
        };

        if (!normalizedTrack.id || !normalizedTrack.title || !normalizedTrack.artist || !normalizedTrack.image) {
            console.error('曲目資料不完整:', normalizedTrack);
            return false;
        }

        if (this.playlists[playlistId].tracks.some(t => t.id === normalizedTrack.id)) {
            console.log('曲目已存在於播放清單中');
            return false;
        }

        this.playlists[playlistId].tracks.push(normalizedTrack);
        console.log('曲目添加成功:', normalizedTrack);
        
        this.saveToLocalStorage();
        this.updateDisplay();
        return true;
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('playlists', JSON.stringify(this.playlists));
            console.log('播放清單已保存到 localStorage');
        } catch (error) {
            console.error('保存播放清單失敗:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('playlists');
            if (saved) {
                this.playlists = JSON.parse(saved);
                console.log('從 localStorage 載入播放清單');
            }
        } catch (error) {
            console.error('載入播放清單失敗:', error);
            this.playlists = {};
        }
    }

    updateDisplay() {
        console.log('更新播放清單顯示');
        const container = document.getElementById('playlist');
        
        if (!container) {
            console.error('找不到播放清單容器元素');
            return;
        }

        if (Object.keys(this.playlists).length === 0) {
            container.innerHTML = '<div class="no-items">尚未建立任何播放清單</div>';
            return;
        }

        const html = Object.values(this.playlists).map(playlist => `
            <div class="playlist-section" data-playlist-id="${playlist.id}">
                <div class="playlist-header">
                    <h3 class="playlist-name">${playlist.name}</h3>
                    <span class="playlist-count">${playlist.tracks.length} 首歌曲</span>
                </div>
                <div class="playlist-tracks">
                    ${this.renderTracks(playlist.tracks)}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderTracks(tracks) {
        if (!tracks.length) {
            return '<div class="no-items">播放清單是空的</div>';
        }

        return tracks.map(track => `
            <div class="playlist-item" data-track-id="${track.id}">
                <div class="playlist-item-thumbnail">
                    <img src="${track.image}" alt="${track.title}">
                </div>
                <div class="playlist-item-content">
                    <div class="playlist-item-info">
                        <h3 class="playlist-item-title">${track.title}</h3>
                        <div class="playlist-item-artist">${track.artist}</div>
                    </div>
                    <div class="playlist-item-actions">
                        <button class="playlist-item-play" onclick="playTrack('${track.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="playlist-item-remove" onclick="removeFromPlaylist('${track.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    hasPlaylists() {
        return Object.keys(this.playlists).length > 0;
    }
}

// 初始化播放清單
const playlist = new Playlist();
