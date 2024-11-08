const fs = require('fs/promises');

const BackupManager = {
    createBackup: async (moduleName) => {
        const date = new Date().toISOString().split('T')[0];
        const backupPath = `backups/${date}/${moduleName}`;
        
        try {
            // 建立備份目錄
            await fs.mkdir(backupPath, { recursive: true });
            
            // 複製模組檔案
            await fs.cp(
                `src/modules/${moduleName}`, 
                backupPath,
                { recursive: true }
            );
            
            console.log(`已建立 ${moduleName} 的備份於 ${backupPath}`);
            
        } catch (error) {
            console.error(`備份失敗: ${error.message}`);
        }
    },
    
    restoreBackup: async (moduleName, date) => {
        const backupPath = `backups/${date}/${moduleName}`;
        const modulePath = `src/modules/${moduleName}`;
        
        try {
            // 先建立目前版本的備份
            await this.createBackup(moduleName);
            
            // 還原指定的備份
            await fs.cp(backupPath, modulePath, { recursive: true });
            
            console.log(`已還原 ${moduleName} 至 ${date} 的版本`);
            
        } catch (error) {
            console.error(`還原失敗: ${error.message}`);
        }
    }
};
