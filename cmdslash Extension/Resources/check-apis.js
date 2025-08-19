console.log('🔍 Checking available APIs in Safari Extension...');

// Check what's available in the browser object
console.log('browser object:', browser);
console.log('browser.history:', browser.history);
console.log('browser.tabs:', browser.tabs);
console.log('browser.storage:', browser.storage);

// Also check chrome namespace (Safari sometimes uses this)
if (typeof chrome !== 'undefined') {
    console.log('chrome object:', chrome);
    console.log('chrome.history:', chrome.history);
}

// Try different ways to access history
if (browser.history) {
    console.log('✅ browser.history exists');
    console.log('Available methods:', Object.keys(browser.history));
} else {
    console.log('❌ browser.history does not exist');
}

// Listen for messages and try to access history
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received:", request);
    
    if (request.type === 'SEARCH_HISTORY') {
        // Try multiple approaches
        const approaches = [];
        
        // Approach 1: browser.history
        if (browser.history && browser.history.search) {
            approaches.push('browser.history.search available');
            browser.history.search({
                text: '',
                maxResults: 10
            }, (results) => {
                console.log('Callback results:', results);
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                }
            });
        }
        
        // Approach 2: chrome.history
        if (typeof chrome !== 'undefined' && chrome.history && chrome.history.search) {
            approaches.push('chrome.history.search available');
            chrome.history.search({
                text: '',
                maxResults: 10
            }, (results) => {
                console.log('Chrome callback results:', results);
            });
        }
        
        // Approach 3: Promise-based
        if (browser.history && browser.history.search) {
            approaches.push('Trying promise-based approach');
            try {
                const promise = browser.history.search({text: '', maxResults: 10});
                promise.then(results => {
                    console.log('Promise results:', results);
                    sendResponse({
                        type: 'SEARCH_RESULTS',
                        results: results || [],
                        debug: 'Got results from promise'
                    });
                }).catch(err => {
                    console.error('Promise error:', err);
                    sendResponse({
                        type: 'SEARCH_RESULTS',
                        results: [],
                        error: err.message
                    });
                });
            } catch (e) {
                console.error('Exception:', e);
            }
        }
        
        console.log('Tried approaches:', approaches);
        
        if (approaches.length === 0) {
            sendResponse({
                type: 'SEARCH_RESULTS',
                results: [],
                error: 'No history API available',
                availableAPIs: Object.keys(browser)
            });
        }
        
        return true;
    }
});