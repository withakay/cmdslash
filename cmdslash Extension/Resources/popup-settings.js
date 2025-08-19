// Update statistics
function updateStats() {
    // Get history count
    browser.runtime.sendMessage({ type: 'GET_STATS' }).then(response => {
        if (response) {
            document.getElementById('history-count').textContent = response.historyCount || 0;
            document.getElementById('storage-size').textContent = formatBytes(response.storageSize || 0);
        }
    });
    
    // Get open tabs count
    browser.tabs.query({}).then(tabs => {
        document.getElementById('tabs-count').textContent = tabs.length;
    });
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Export history
document.getElementById('export-btn').addEventListener('click', () => {
    console.log('Export button clicked');
    browser.runtime.sendMessage({ type: 'EXPORT_HISTORY' }).then(response => {
        console.log('Export response:', response);
        if (response && response.data) {
            // Create download using a different approach for Safari
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cmdslash-history-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            // Show success
            const btn = document.getElementById('export-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Exported!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } else {
            console.error('No data received for export');
            alert('Export failed - no data received');
        }
    }).catch(error => {
        console.error('Export error:', error);
        alert('Export failed: ' + error.message);
    });
});

// Import history
document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            browser.runtime.sendMessage({ 
                type: 'IMPORT_HISTORY',
                data: e.target.result
            }).then(response => {
                if (response) {
                    if (response.type === 'IMPORT_SUCCESS') {
                        alert(`Successfully imported ${response.imported} new items!\nTotal history: ${response.total} items`);
                        updateStats();
                    } else if (response.type === 'IMPORT_ERROR') {
                        alert('Import failed: ' + response.error);
                    }
                }
            });
        };
        reader.readAsText(file);
    }
});

// Clear history
document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        browser.runtime.sendMessage({ type: 'CLEAR_HISTORY' }).then(() => {
            updateStats();
            const btn = document.getElementById('clear-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Cleared!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }
});

// Import Safari history
document.getElementById('import-safari-btn').addEventListener('click', () => {
    // Send message to native app
    browser.runtime.sendMessage({ type: 'IMPORT_SAFARI_HISTORY' }).then(response => {
        if (response) {
            if (response.success) {
                alert(`Imported ${response.count} items from Safari history!`);
                updateStats();
            } else {
                alert('Safari history import requires the companion app to be running.');
            }
        }
    });
});

// Initialize on load
updateStats();