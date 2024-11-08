if (typeof playlist === 'undefined') {
    console.error('playlist.js 未正確載入');
} else {
    console.log('playlist-utils.js 載入成功');
    // ... playlist-utils.js 的其餘代碼 ...
}

function addSpotifyTrackToPlaylist(id, name, artist, image) {
    const track = {
        id: 'spotify_' + id,
        title: name,
        artist: artist,
        image: image,
        source: 'spotify'
    };
    
    if (!playlist.hasPlaylists()) {
        showCreatePlaylistModal(track);
    } else {
        // 之後可以改為選擇播放清單
        const defaultPlaylistId = Object.keys(playlist.playlists)[0];
        playlist.addTrack(defaultPlaylistId, track);
    }
}

function addYoutubeTrackToPlaylist(id, title, channelTitle, thumbnail) {
    const track = {
        id: 'youtube_' + id,
        title: title,
        artist: channelTitle,
        image: thumbnail,
        source: 'youtube'
    };
    
    if (!playlist.hasPlaylists()) {
        showCreatePlaylistModal(track);
    } else {
        // 之後可以改為選擇播放清單
        const defaultPlaylistId = Object.keys(playlist.playlists)[0];
        playlist.addTrack(defaultPlaylistId, track);
    }
}
