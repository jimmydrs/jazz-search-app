class BatchProcessor {
    constructor() {
        this.toggleButton = document.getElementById('toggleBatchInput');
        this.container = document.getElementById('batchInputContainer');
        this.textarea = document.getElementById('batchInput');
        this.processButton = document.getElementById('processBatchInput');
        this.statusElement = document.getElementById('batchStatus');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 切換批量輸入介面
        this.toggleButton.addEventListener('click', () => {
            this.container.classList.toggle('hidden');
            this.toggleButton.textContent = 
                this.container.classList.contains('hidden') 
                    ? '切換批量輸入' 
                    : '隱藏批量輸入';
        });

        // 處理批量輸入
        this.processButton.addEventListener('click', () => {
            this.processBatchInput();
        });
    }

    async processBatchInput() {
        const input = this.textarea.value.trim();
        if (!input) {
            this.updateStatus('請輸入歌曲名稱');
            return;
        }

        // 分割輸入文字為歌曲清單
        const songs = input
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (songs.length === 0) {
            this.updateStatus('未找到有效的歌曲名稱');
            return;
        }

        this.updateStatus(`處理中... (0/${songs.length})`);
        
        // 逐一處理每首歌
        for (let i = 0; i < songs.length; i++) {
            try {
                this.updateStatus(`處理中... (${i + 1}/${songs.length})`);
                await this.searchSong(songs[i]);
                // 添加延遲以避免 API 限制
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`處理歌曲時發生錯誤: ${songs[i]}`, error);
            }
        }

        this.updateStatus(`完成處理 ${songs.length} 首歌曲`);
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
    }

    async searchSong(songName) {
        // 使用現有的搜尋函數
        // 這部分需要整合現有的搜尋邏輯
        console.log(`搜尋歌: ${songName}`);
        // TODO: 整合實際的搜尋功能
    }
} 