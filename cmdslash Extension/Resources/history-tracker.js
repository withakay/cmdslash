console.log('🚀 History Tracker Background Script Loaded');

// Store our own history since Safari doesn't provide history API
let recentHistory = [];
const MAX_HISTORY_ITEMS = 1000;

// Load history from storage on startup
browser.storage.local.get(['historyData']).then(result => {
    if (result.historyData) {
        recentHistory = result.historyData;
        console.log('Loaded', recentHistory.length, 'history items from storage');
    }
});

// Track tab updates to build our own history
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url && !tab.url.startsWith('about:')) {
        addToHistory(tab.url, tab.title || tab.url);
    }
});

function addToHistory(url, title) {
    // Skip extension pages and empty URLs
    if (!url || url.startsWith('safari-web-extension://') || url === 'about:blank') {
        return;
    }
    
    const now = Date.now();
    
    // Extract favicon URL
    const favicon = getFaviconUrl(url);
    
    // Find if URL already exists
    const existingIndex = recentHistory.findIndex(item => item.url === url);
    
    if (existingIndex !== -1) {
        // Update existing entry
        recentHistory[existingIndex].visitCount = (recentHistory[existingIndex].visitCount || 1) + 1;
        recentHistory[existingIndex].lastVisitTime = now;
        if (title && title !== url) {
            recentHistory[existingIndex].title = title;
        }
        recentHistory[existingIndex].favicon = favicon;
    } else {
        // Add new entry
        recentHistory.unshift({
            url: url,
            title: title || url,
            lastVisitTime: now,
            visitCount: 1,
            favicon: favicon
        });
        
        // Keep history size limited
        if (recentHistory.length > MAX_HISTORY_ITEMS) {
            recentHistory = recentHistory.slice(0, MAX_HISTORY_ITEMS);
        }
    }
    
    // Save to storage (debounced)
    saveHistory();
}

function getFaviconUrl(url) {
    try {
        const urlObj = new URL(url);
        // Use Google's favicon service as fallback
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
        return null;
    }
}

// Debounce saving to storage
let saveTimeout;
function saveHistory() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        browser.storage.local.set({ historyData: recentHistory }).then(() => {
            console.log('Saved', recentHistory.length, 'history items');
        });
    }, 1000);
}

// Handle search requests
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received:", request);
    
    if (request.type === 'SEARCH_HISTORY') {
        const query = (request.query || '').toLowerCase();
        console.log('Searching for:', query, 'in', recentHistory.length, 'items + open tabs');
        
        // Get all open tabs first
        browser.tabs.query({}).then(tabs => {
            console.log('Found', tabs.length, 'open tabs');
            
            // Convert tabs to our history format and mark as open tabs
            const openTabs = tabs
                .filter(tab => tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('safari-web-extension://'))
                .map(tab => ({
                    url: tab.url,
                    title: tab.title || tab.url,
                    lastVisitTime: Date.now(), // Current tabs are "most recent"
                    visitCount: 1,
                    favicon: getFaviconUrl(tab.url),
                    isOpenTab: true,
                    tabId: tab.id,
                    tabIndex: tab.index,
                    windowId: tab.windowId
                }));
            
            // Search in both open tabs and history
            let tabResults = openTabs;
            let historyResults = recentHistory;
            
            // Filter if query provided
            if (query) {
                tabResults = openTabs.filter(item => {
                    const url = (item.url || '').toLowerCase();
                    const title = (item.title || '').toLowerCase();
                    return url.includes(query) || title.includes(query);
                });
                
                historyResults = recentHistory.filter(item => {
                    const url = (item.url || '').toLowerCase();
                    const title = (item.title || '').toLowerCase();
                    // Exclude if already in open tabs
                    const isOpenTab = openTabs.some(tab => tab.url === item.url);
                    return !isOpenTab && (url.includes(query) || title.includes(query));
                });
            } else {
                // Remove duplicates from history if they're open tabs
                historyResults = recentHistory.filter(item => 
                    !openTabs.some(tab => tab.url === item.url)
                );
            }
            
            // Combine results: open tabs first, then history
            const combinedResults = [
                ...tabResults.sort((a, b) => a.tabIndex - b.tabIndex), // Sort tabs by index
                ...historyResults.sort((a, b) => b.lastVisitTime - a.lastVisitTime)
            ].slice(0, 50);
            
            console.log('Returning', combinedResults.length, 'results (',
                tabResults.length, 'tabs,', 
                historyResults.length, 'history items)');
            
            sendResponse({
                type: 'SEARCH_RESULTS',
                results: combinedResults
            });
        }).catch(error => {
            console.error('Error getting tabs:', error);
            // Fallback to just history if tabs API fails
            let results = recentHistory;
            if (query) {
                results = recentHistory.filter(item => {
                    const url = (item.url || '').toLowerCase();
                    const title = (item.title || '').toLowerCase();
                    return url.includes(query) || title.includes(query);
                });
            }
            sendResponse({
                type: 'SEARCH_RESULTS',
                results: results.slice(0, 50)
            });
        });
        
        return true;
    }
    
    if (request.type === 'OPEN_URL') {
        browser.tabs.create({ url: request.url });
        return Promise.resolve({ success: true });
    }
    
    if (request.type === 'SWITCH_TO_TAB') {
        // Switch to existing tab
        console.log('Switching to tab:', request.tabId);
        browser.tabs.update(request.tabId, { active: true }).then(() => {
            // Also focus the window containing the tab
            if (request.windowId) {
                browser.windows.update(request.windowId, { focused: true });
            }
        }).catch(error => {
            console.error('Error switching to tab:', error);
            // Fallback: open URL in new tab if switching fails
            browser.tabs.get(request.tabId).then(tab => {
                if (tab && tab.url) {
                    browser.tabs.create({ url: tab.url });
                }
            });
        });
        return Promise.resolve({ success: true });
    }
    
    if (request.type === 'EXPORT_HISTORY') {
        // Export history as JSON
        console.log('Export requested, history items:', recentHistory.length);
        const exportData = {
            version: 1,
            exportDate: new Date().toISOString(),
            historyCount: recentHistory.length,
            history: recentHistory
        };
        const jsonData = JSON.stringify(exportData, null, 2);
        console.log('Sending export data, size:', jsonData.length, 'bytes');
        sendResponse({
            type: 'EXPORT_DATA',
            data: jsonData
        });
        return true;
    }
    
    if (request.type === 'GET_STATS') {
        // Get statistics
        const storageSize = JSON.stringify(recentHistory).length;
        sendResponse({
            historyCount: recentHistory.length,
            storageSize: storageSize
        });
        return true;
    }
    
    if (request.type === 'CLEAR_HISTORY') {
        // Clear all history
        recentHistory = [];
        saveHistory();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === 'IMPORT_SAFARI_HISTORY') {
        // Since Safari doesn't expose history API, we'll provide instructions
        sendResponse({
            success: false,
            message: "Safari doesn't allow direct history access. The extension will build history as you browse."
        });
        return true;
    }
    
    if (request.type === 'IMPORT_HISTORY') {
        // Import history from JSON
        try {
            const importData = JSON.parse(request.data);
            if (importData.history && Array.isArray(importData.history)) {
                // Merge with existing history
                const existingUrls = new Set(recentHistory.map(item => item.url));
                const newItems = importData.history.filter(item => !existingUrls.has(item.url));
                recentHistory = [...recentHistory, ...newItems].slice(0, MAX_HISTORY_ITEMS);
                
                // Save to storage
                saveHistory();
                
                sendResponse({
                    type: 'IMPORT_SUCCESS',
                    imported: newItems.length,
                    total: recentHistory.length
                });
            } else {
                throw new Error('Invalid import data format');
            }
        } catch (error) {
            sendResponse({
                type: 'IMPORT_ERROR',
                error: error.message
            });
        }
        return true;
    }
});

// Also track active tab changes
browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId).then(tab => {
        if (tab.url && !tab.url.startsWith('about:')) {
            addToHistory(tab.url, tab.title || tab.url);
        }
    });
});

// Import browser history if we ever get access to it (for future Safari versions)
function tryImportBrowserHistory() {
    if (browser.history && browser.history.search) {
        console.log('History API detected, importing...');
        browser.history.search({
            text: '',
            maxResults: 1000,
            startTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
        }).then(items => {
            console.log('Imported', items.length, 'history items');
            items.forEach(item => {
                addToHistory(item.url, item.title);
            });
        }).catch(err => {
            console.error('Failed to import history:', err);
        });
    }
}

// Try importing on startup
setTimeout(tryImportBrowserHistory, 1000);

console.log('History tracker initialized. Will build history as you browse.');