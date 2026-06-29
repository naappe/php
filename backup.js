// ============================================
// DATA BACKUP SYSTEM
// ============================================

class BackupSystem {
    constructor() {
        this.backupPrefix = 'bills_backup_';
        this.maxBackups = 30; // Keep 30 days of backups
        this.backupInterval = 24 * 60 * 60 * 1000; // 24 hours
        this.lastBackupKey = 'bills_last_backup';
        this.backupCountKey = 'bills_backup_count';
    }

    // ============================================
    // CREATE BACKUP
    // ============================================
    createBackup(data) {
        try {
            const timestamp = new Date().toISOString();
            const dateStr = timestamp.slice(0, 10); // YYYY-MM-DD
            const timeStr = timestamp.slice(11, 19).replace(/:/g, '-'); // HH-MM-SS
            
            const backupData = {
                metadata: {
                    version: '1.0',
                    created: timestamp,
                    totalBills: data.bills.length,
                    totalAmount: data.totalAmount,
                    backupId: `${dateStr}_${timeStr}`
                },
                bills: data.bills,
                stats: {
                    totalAmount: data.totalAmount,
                    vendorCount: new Set(data.bills.map(b => b.Vendor)).size
                }
            };

            const backupKey = `${this.backupPrefix}${dateStr}_${timeStr}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // Update backup metadata
            this.updateBackupMetadata(dateStr);
            this.cleanupOldBackups();
            
            console.log(`✅ Backup created: ${backupKey}`);
            console.log(`📊 Bills backed up: ${data.bills.length}`);
            console.log(`💰 Total Amount: ${formatMVR(data.totalAmount)}`);
            
            return backupData;
        } catch (error) {
            console.error('❌ Backup failed:', error);
            return null;
        }
    }

    // ============================================
    // UPDATE BACKUP METADATA
    // ============================================
    updateBackupMetadata(dateStr) {
        const metadata = {
            lastBackup: dateStr,
            lastBackupTime: new Date().toISOString(),
            totalBackups: this.getBackupCount(),
            nextBackup: new Date(Date.now() + this.backupInterval).toISOString()
        };
        localStorage.setItem(this.lastBackupKey, JSON.stringify(metadata));
        
        // Update count
        const count = this.getBackupCount() + 1;
        localStorage.setItem(this.backupCountKey, String(count));
    }

    // ============================================
    // GET BACKUP COUNT
    // ============================================
    getBackupCount() {
        return parseInt(localStorage.getItem(this.backupCountKey) || '0');
    }

    // ============================================
    // LIST ALL BACKUPS
    // ============================================
    listBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.backupPrefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key: key,
                        created: data.metadata.created,
                        totalBills: data.metadata.totalBills,
                        totalAmount: data.metadata.totalAmount,
                        backupId: data.metadata.backupId
                    });
                } catch (e) {
                    console.warn('Invalid backup:', key);
                }
            }
        }
        return backups.sort((a, b) => b.created.localeCompare(a.created));
    }

    // ============================================
    // RESTORE BACKUP
    // ============================================
    restoreBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }
            
            const data = JSON.parse(backupData);
            console.log(`📥 Restoring backup from ${data.metadata.created}`);
            console.log(`📊 Bills: ${data.bills.length}`);
            
            // Update state
            state.bills = data.bills;
            state.totalAmount = data.stats.totalAmount || data.bills.reduce((sum, b) => sum + parseFloat(b.Amount || 0), 0);
            
            saveToCache();
            applyFilters();
            updateStats();
            renderTable();
            renderFilterOptions();
            
            showMessage(`✅ Restored ${data.bills.length} bills from backup`, 'success', 5000);
            return data;
        } catch (error) {
            console.error('❌ Restore failed:', error);
            showMessage(`❌ Restore failed: ${error.message}`, 'error');
            return null;
        }
    }

    // ============================================
    // CLEANUP OLD BACKUPS
    // ============================================
    cleanupOldBackups() {
        const backups = this.listBackups();
        if (backups.length <= this.maxBackups) return;
        
        const toDelete = backups.slice(this.maxBackups);
        toDelete.forEach(backup => {
            localStorage.removeItem(backup.key);
            console.log(`🗑️ Removed old backup: ${backup.key}`);
        });
    }

    // ============================================
    // EXPORT BACKUP AS JSON FILE
    // ============================================
    exportBackupToFile(backupKey = null) {
        let backupData;
        
        if (backupKey) {
            const data = localStorage.getItem(backupKey);
            if (!data) {
                showMessage('Backup not found!', 'error');
                return;
            }
            backupData = JSON.parse(data);
        } else {
            // Create a new backup first
            backupData = this.createBackup(state);
            if (!backupData) {
                showMessage('Failed to create backup!', 'error');
                return;
            }
        }
        
        // Create downloadable file
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bills_backup_${backupData.metadata.backupId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showMessage(`📥 Backup exported: ${a.download}`, 'success');
    }

    // ============================================
    // IMPORT BACKUP FROM FILE
    // ============================================
    importBackupFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate backup format
                if (!data.bills || !data.metadata) {
                    throw new Error('Invalid backup file format');
                }
                
                // Confirm restore
                const confirmMsg = `This will replace ALL current data with ${data.bills.length} bills from backup (${data.metadata.created}). Continue?`;
                if (!confirm(confirmMsg)) return;
                
                // Restore the data
                state.bills = data.bills;
                state.totalAmount = data.stats.totalAmount || data.bills.reduce((sum, b) => sum + parseFloat(b.Amount || 0), 0);
                
                saveToCache();
                applyFilters();
                updateStats();
                renderTable();
                renderFilterOptions();
                
                showMessage(`✅ Imported ${data.bills.length} bills from backup`, 'success', 5000);
                
            } catch (error) {
                console.error('Import failed:', error);
                showMessage(`❌ Import failed: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    // ============================================
    // CHECK AND CREATE AUTOMATIC BACKUP
    // ============================================
    checkAndAutoBackup() {
        const metadata = localStorage.getItem(this.lastBackupKey);
        
        if (!metadata) {
            console.log('📦 No previous backup found, creating initial backup...');
            this.createBackup(state);
            return;
        }
        
        try {
            const meta = JSON.parse(metadata);
            const lastBackupTime = new Date(meta.lastBackupTime).getTime();
            const now = Date.now();
            
            // Check if 24 hours have passed
            if (now - lastBackupTime >= this.backupInterval) {
                console.log('📦 Daily backup triggered...');
                this.createBackup(state);
            } else {
                const hoursLeft = Math.round((this.backupInterval - (now - lastBackupTime)) / (60 * 60 * 1000));
                console.log(`⏳ Next backup in ~${hoursLeft} hours`);
            }
        } catch (e) {
            console.warn('Backup check failed, creating new backup...');
            this.createBackup(state);
        }
    }

    // ============================================
    // BACKUP UI
    // ============================================
    renderBackupUI() {
        const backups = this.listBackups();
        const metadata = localStorage.getItem(this.lastBackupKey);
        const meta = metadata ? JSON.parse(metadata) : null;
        
        const container = document.getElementById('backupContainer');
        if (!container) return;
        
        let html = `
            <div class="backup-panel">
                <div class="backup-header">
                    <h3>🔐 Data Backup & Security</h3>
                    <div class="backup-status">
                        <span class="status-badge ${meta ? 'active' : 'inactive'}">
                            ${meta ? '✅ Auto-backup active' : '⚠️ No backup configured'}
                        </span>
                    </div>
                </div>
                
                <div class="backup-actions">
                    <button class="btn btn-primary" onclick="backupSystem.createBackup(state); updateBackupUI();">
                        💾 Backup Now
                    </button>
                    <button class="btn btn-secondary" onclick="backupSystem.exportBackupToFile()">
                        📥 Export Latest
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importBackupInput').click()">
                        📤 Import Backup
                    </button>
                    <input type="file" id="importBackupInput" accept=".json" style="display:none" 
                           onchange="backupSystem.importBackupFromFile(this.files[0]); this.value='';">
                    <button class="btn btn-secondary" onclick="showRestoreDialog()">
                        🔄 Restore
                    </button>
                </div>
                
                <div class="backup-info">
                    <div class="backup-stats">
                        <span>📊 ${backups.length} backups stored</span>
                        <span>📅 ${meta ? `Last backup: ${new Date(meta.lastBackupTime).toLocaleString()}` : 'No backups yet'}</span>
                        ${meta ? `<span>⏰ Next backup: ${new Date(meta.nextBackup).toLocaleString()}</span>` : ''}
                    </div>
                </div>
                
                <div class="backup-list">
                    <h4>📋 Backup History</h4>
                    ${backups.length === 0 ? '<p class="empty-text">No backups available</p>' : ''}
                    <div class="backup-items">
                        ${backups.slice(0, 10).map(backup => `
                            <div class="backup-item">
                                <div class="backup-item-info">
                                    <span class="backup-date">📅 ${new Date(backup.created).toLocaleString()}</span>
                                    <span class="backup-count">📄 ${backup.totalBills} bills</span>
                                    <span class="backup-amount">💰 ${formatMVR(backup.totalAmount)}</span>
                                </div>
                                <div class="backup-item-actions">
                                    <button class="btn-icon" onclick="backupSystem.exportBackupToFile('${backup.key}')" title="Export">📥</button>
                                    <button class="btn-icon" onclick="backupSystem.restoreBackup('${backup.key}'); updateBackupUI();" title="Restore">🔄</button>
                                    <button class="btn-icon delete" onclick="deleteBackup('${backup.key}')" title="Delete">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
}

// ============================================
// BACKUP SYSTEM INSTANCE
// ============================================
const backupSystem = new BackupSystem();

// ============================================
// DELETE BACKUP
// ============================================
function deleteBackup(backupKey) {
    if (!confirm(`Delete backup ${backupKey}?`)) return;
    localStorage.removeItem(backupKey);
    showMessage('🗑️ Backup deleted', 'warning');
    updateBackupUI();
}

// ============================================
// SHOW RESTORE DIALOG
// ============================================
function showRestoreDialog() {
    const backups = backupSystem.listBackups();
    if (backups.length === 0) {
        showMessage('No backups available to restore', 'warning');
        return;
    }
    
    const html = `
        <div class="modal-header">
            <h2>🔄 Restore Backup</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <p>Select a backup to restore:</p>
            <div class="restore-list">
                ${backups.map(backup => `
                    <div class="restore-item" onclick="backupSystem.restoreBackup('${backup.key}'); closeModal(); updateBackupUI();">
                        <div>
                            <strong>📅 ${new Date(backup.created).toLocaleString()}</strong>
                            <span>📄 ${backup.totalBills} bills</span>
                            <span>💰 ${formatMVR(backup.totalAmount)}</span>
                        </div>
                        <button class="btn btn-primary">Restore</button>
                    </div>
                `).join('')}
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    
    openModal(html);
}

// ============================================
// UPDATE BACKUP UI
// ============================================
function updateBackupUI() {
    backupSystem.renderBackupUI();
}

// ============================================
// AUTO-BACKUP SCHEDULER
// ============================================
function startAutoBackup() {
    // Check for backup on page load
    setTimeout(() => {
        backupSystem.checkAndAutoBackup();
        updateBackupUI();
    }, 5000);
    
    // Check every hour
    setInterval(() => {
        backupSystem.checkAndAutoBackup();
        updateBackupUI();
    }, 60 * 60 * 1000); // Every hour
}

// ============================================
// EXPORT ALL DATA AS CSV (Enhanced)
// ============================================
function exportFullBackup() {
    const backups = backupSystem.listBackups();
    if (backups.length === 0) {
        showMessage('No backups to export', 'warning');
        return;
    }
    
    // Create a zip-like structure (multiple JSON files in one)
    const exportData = {
        exportDate: new Date().toISOString(),
        totalBackups: backups.length,
        backups: backups.map(key => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        }).filter(Boolean),
        currentData: {
            bills: state.bills,
            totalAmount: state.totalAmount,
            timestamp: new Date().toISOString()
        }
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_backup_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage(`📥 Full export completed: ${a.download}`, 'success');
}

// ============================================
// SECURITY: ENCRYPT BACKUP (Simple)
// ============================================
function encryptBackup(data, password) {
    // Simple encryption for demonstration
    // In production, use a proper encryption library
    const encoded = btoa(JSON.stringify(data));
    const encrypted = encoded.split('').map((char, i) => {
        const keyChar = password[i % password.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    
    return btoa(encrypted);
}

function decryptBackup(encryptedData, password) {
    try {
        const decoded = atob(encryptedData);
        const decrypted = decoded.split('').map((char, i) => {
            const keyChar = password[i % password.length];
            return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
        }).join('');
        
        return JSON.parse(atob(decrypted));
    } catch (e) {
        throw new Error('Invalid password or corrupted data');
    }
}