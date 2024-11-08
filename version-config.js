const VERSION_CONFIG = {
    current: '1.1.0',
    modules: {
        spotify: {
            version: '1.1.0',
            fallback: '1.0.0',
            path: '/modules/spotify/v1/'
        },
        youtube: {
            version: '1.0.1',
            fallback: '1.0.0',
            path: '/modules/youtube/v1/'
        },
        playlist: {
            version: '1.0.0',
            fallback: null,
            path: '/modules/playlist/v1/'
        }
    }
};

window.config = {
    spotify: {
        clientId: '8718a0f9f52e4896825367805e6b6661',
        redirectUri: 'http://localhost:3000/callback.html'
    }
};
