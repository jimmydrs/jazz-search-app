class YouTubeAPI {
    static async search(query) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' jazz')}&type=video&maxResults=10&key=${YOUTUBE_CONFIG.apiKey}`);
            
            if (!response.ok) {
                throw new Error('YouTube API 請求失敗');
            }

            const data = await response.json();
            const videos = data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high.url,
                channelTitle: item.snippet.channelTitle
            }));

            // 計算相關性分數並排序
            return this.sortByRelevance(videos, query);

        } catch (error) {
            console.error('YouTube 搜尋錯誤：', error);
            throw error;
        }
    }

    static sortByRelevance(videos, query) {
        return videos
            .map(video => ({
                ...video,
                relevanceScore: this.calculateRelevanceScore(video.title, video.description, query)
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    static calculateRelevanceScore(title, description, query) {
        const content = (title + ' ' + description).toLowerCase();
        const searchTerms = query.toLowerCase().split(' ');
        let score = 0;

        // 音樂風格關鍵字及其權重
        const styleKeywords = {
            'jazz': 8,
            'blues': 7,
            'swing': 7,
            'bebop': 7,
            'fusion': 6,
            'improvisation': 6,
            'saxophone': 5,
            'trumpet': 5,
            'piano': 5,
            'quartet': 5,
            'trio': 5,
            'ensemble': 5,
            'standards': 6,
            'modern': 6,
            'contemporary': 6,
            'instrumental': 5,
            'acoustic': 5,
            'live': 5,
            
            // 古典相關（負向扣分）
            'classical': -5,
            'orchestra': -4,
            'symphony': -4,
            'concerto': -4,
            'sonata': -4,
            'philharmonic': -4
        };

        // 計算關鍵字分數
        Object.entries(styleKeywords).forEach(([keyword, weight]) => {
            if (content.includes(keyword)) {
                score += weight;
            }
        });

        // 檢查標題完全匹配
        if (title.toLowerCase() === query.toLowerCase()) {
            score += 10;
        }

        // 檢查搜尋詞的匹配度
        searchTerms.forEach(term => {
            if (title.toLowerCase().includes(term)) {
                score += 3;
            }
            if (description.toLowerCase().includes(term)) {
                score += 1;
            }
        });

        // 知名爵士樂藝術家加分
        const jazzArtists = [
            'miles davis', 'john coltrane', 'charlie parker', 'duke ellington',
            'louis armstrong', 'bill evans', 'charles mingus', 'thelonious monk',
            'dizzy gillespie', 'art blakey', 'sonny rollins', 'herbie hancock',
            'wayne shorter', 'oscar peterson', 'count basie', 'ella fitzgerald',
            'billie holiday', 'sarah vaughan', 'dexter gordon', 'cannonball adderley'
        ];

        jazzArtists.forEach(artist => {
            if (content.includes(artist.toLowerCase())) {
                score += 5;
            }
        });

        // 降低優先級的內容
        const lowPriorityContent = [
            'classical',
            'orchestra',
            'symphony',
            'k-pop',
            'kpop cover',
            'korean cover',
            'piano cover',
            '피아노 커버',  // 韓文「piano cover」
            '피아니스트',   // 韓文「pianist」
            'korea',
            'seoul',
            'relaxing piano',
            'piano tutorial',
            'sheet music',
            'music score'
        ];

        lowPriorityContent.forEach(term => {
            if (content.includes(term.toLowerCase())) {
                score -= 5;
            }
        });

        // 檢查是否包含韓文字符
        if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/.test(content)) {
            score -= 8;
        }

        return score;
    }
}
