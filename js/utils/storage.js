/**
 * Storage Utility
 * Handles localStorage operations and data persistence
 */

class StorageManager {
    constructor() {
        this.storageKey = 'conscious-spending-data';
        this.settingsKey = 'conscious-spending-settings';
    }

    /**
     * Save scenario data to localStorage
     */
    saveScenario(scenarioName, data) {
        try {
            const allData = this.getAllScenarios();
            allData[scenarioName] = {
                ...data,
                lastModified: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            return true;
        } catch (error) {
            console.error('Error saving scenario:', error);
            return false;
        }
    }

    /**
     * Load specific scenario from localStorage
     */
    loadScenario(scenarioName) {
        try {
            const allData = this.getAllScenarios();
            return allData[scenarioName] || null;
        } catch (error) {
            console.error('Error loading scenario:', error);
            return null;
        }
    }

    /**
     * Get all scenarios
     */
    getAllScenarios() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting all scenarios:', error);
            return {};
        }
    }

    /**
     * Delete a scenario
     */
    deleteScenario(scenarioName) {
        try {
            const allData = this.getAllScenarios();
            delete allData[scenarioName];
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            return true;
        } catch (error) {
            console.error('Error deleting scenario:', error);
            return false;
        }
    }

    /**
     * Export all scenarios as JSON
     */
    exportScenarios() {
        try {
            const allData = this.getAllScenarios();
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `conscious-spending-scenarios-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            return true;
        } catch (error) {
            console.error('Error exporting scenarios:', error);
            return false;
        }
    }

    /**
     * Import scenarios from JSON file
     */
    importScenarios(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    const currentData = this.getAllScenarios();
                    
                    // Merge imported data with current data
                    const mergedData = { ...currentData, ...importedData };
                    localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
                    
                    resolve(Object.keys(importedData));
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Save user settings
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Load user settings
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            theme: 'light',
            currency: 'USD',
            defaultView: 'combined',
            autoSave: true,
            showTooltips: true,
            defaultFilingStatus: 'marriedFilingJointly',
            defaultState: 'CA'
        };
    }

    /**
     * Clear all data (with confirmation)
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all scenarios and settings? This cannot be undone.')) {
            try {
                localStorage.removeItem(this.storageKey);
                localStorage.removeItem(this.settingsKey);
                return true;
            } catch (error) {
                console.error('Error clearing data:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        try {
            const scenarios = JSON.stringify(this.getAllScenarios()).length;
            const settings = JSON.stringify(this.loadSettings()).length;
            const total = scenarios + settings;
            
            return {
                scenarios: this.formatBytes(scenarios),
                settings: this.formatBytes(settings),
                total: this.formatBytes(total),
                available: this.formatBytes(5 * 1024 * 1024 - total) // Assuming 5MB localStorage limit
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Backup data to external service (placeholder for future implementation)
     */
    async backupToCloud(provider = 'github') {
        // Placeholder for cloud backup functionality
        // Could integrate with GitHub Gists, Google Drive, etc.
        console.log(`Cloud backup to ${provider} not implemented yet`);
        return false;
    }

    /**
     * Auto-save functionality
     */
    enableAutoSave(callback, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, interval);
    }

    /**
     * Disable auto-save
     */
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}