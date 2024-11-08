class AdminAuth {
    constructor() {
        this.checkAuth();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/admin/auth');
            if (!response.ok) {
                window.location.href = '/'; // 重定向到首頁
                return;
            }
            const data = await response.json();
            if (!data.isAdmin) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Admin auth check failed:', error);
            window.location.href = '/';
        }
    }
}

// 初始化管理員認證
new AdminAuth(); 