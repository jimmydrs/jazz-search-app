class MonitoringDashboard {
    constructor() {
        this.initializeUpdates();
    }

    async loadMonitoringData() {
        try {
            const response = await fetch('/api/admin/monitoring');
            if (!response.ok) throw new Error('載入失敗');
            
            const data = await response.json();
            this.updateDashboard(data);
        } catch (error) {
            console.error('Error loading monitoring data:', error);
            document.querySelector('.dashboard').innerHTML = 
                '<p class="error">載入監控數據時發生錯誤</p>';
        }
    }

    updateDashboard(data) {
        // 更新系統概覽
        document.getElementById('overviewData').innerHTML = this.formatOverview(data);
        // 更新錯誤統計
        document.getElementById('errorData').innerHTML = this.formatErrors(data.errors);
        // 更新 API 效能
        document.getElementById('apiData').innerHTML = this.formatApiStats(data);
        // 更新搜尋記錄
        document.getElementById('searchData').innerHTML = this.formatSearches(data.recentSearches);
    }

    formatOverview(data) {
        return `
            <div class="metric">
                運行時間: ${this.formatUptime(data.uptime)}
            </div>
            <div>
                總請求數: ${data.totalRequests}
            </div>
            <div>
                活躍用戶: ${data.activeUsers}
            </div>
            <div>
                記憶體使用: ${this.formatBytes(data.systemResources.memory.used)} / 
                ${this.formatBytes(data.systemResources.memory.total)}
            </div>
            <div>
                CPU 負載: ${data.systemResources.cpu[0].toFixed(2)}
            </div>
        `;
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}天 ${hours}時 ${minutes}分`;
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    formatErrors(errors) {
        if (!errors.length) return '<div class="success">無最近錯誤</div>';
        return errors.map(error => `
            <div class="error">
                ${new Date(error.time).toLocaleString()}: 
                ${error.path} (${error.status})
            </div>
        `).join('');
    }

    formatApiStats(data) {
        return `
            <h3>Spotify API</h3>
            ${this.formatApiMetrics(data.apiPerformance.spotify)}
            <h3>YouTube API</h3>
            ${this.formatApiMetrics(data.apiPerformance.youtube)}
        `;
    }

    formatApiMetrics(stats) {
        if (!stats) return '<div class="warning">無數據</div>';
        return `
            <div>平均響應時間: ${stats.avgResponseTime.toFixed(2)}ms</div>
            <div>最快響應: ${stats.minResponseTime}ms</div>
            <div>最慢響應: ${stats.maxResponseTime}ms</div>
            <div>錯誤率: ${(stats.errorRate * 100).toFixed(2)}%</div>
        `;
    }

    formatSearches(searches) {
        if (!searches.length) return '<div class="warning">無最近搜尋</div>';
        return searches.map(search => `
            <div>
                ${new Date(search.time).toLocaleString()}: 
                "${search.query}"
            </div>
        `).join('');
    }

    initializeUpdates() {
        // 立即載入數據
        this.loadMonitoringData();
        // 每 30 秒更新一次
        setInterval(() => this.loadMonitoringData(), 30000);
    }
}

// 初始化監控面板
new MonitoringDashboard(); 