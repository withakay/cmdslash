console.log('History Fuzzy Search: Background script loaded');

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);

    if (request.type === 'SEARCH_HISTORY') {
        console.log('History search requested for query:', request.query);
        
        browser.history.search({
            text: request.query || '',
            maxResults: 100,
            startTime: 0
        }).then(results => {
            console.log('History API returned', results.length, 'results');
            sendResponse({ 
                type: 'SEARCH_RESULTS', 
                results: results.map(item => ({
                    url: item.url,
                    title: item.title,
                    lastVisitTime: item.lastVisitTime,
                    visitCount: item.visitCount
                }))
            });
        }).catch(error => {
            console.error('History search error:', error);
            sendResponse({ 
                type: 'SEARCH_RESULTS', 
                results: [],
                error: error.message
            });
        });
        
        return true;
    }
    
    if (request.type === 'OPEN_URL') {
        browser.tabs.create({ url: request.url });
        return Promise.resolve({ success: true });
    }
    
    if (request.greeting === "hello")
        return Promise.resolve({ farewell: "goodbye" });
});

// Keyboard shortcuts are handled directly in the content script
// Safari has issues with manifest v3 commands, so we use content script event listeners instead
