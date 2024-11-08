class BatchProcessor {
    constructor() {
        this.toggleButton = document.getElementById('toggleBatchInput');
        this.container = document.getElementById('batchInputContainer');
        this.textarea = document.getElementById('batchInput');
        this.processButton = document.getElementById('processBatchInput');
        this.statusElement = document.getElementById('batchStatus');
        
        this.setupEventListeners();
    }

    // 修改 processBatchInput 函數
    async processBatchInput() {
        const lines = this.textarea.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            alert('請輸入要搜尋的歌曲');
            return;
        }

        this.processButton.disabled = true;
        this.processButton.textContent = '處理中...';

        for (const line of lines) {
            // 等待一下以避免 API 請求過於頻繁
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 設置搜尋值
            document.getElementById('search-input').value = line;
            // 直接調用搜尋函數
            performSearch();
        }

        this.processButton.disabled = false;
        this.processButton.textContent = '處理清單';
    }

    // ... 其餘代碼保持不變 ...
} 