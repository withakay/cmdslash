console.log('🚀 Background script loaded!');

// Test with dummy data first
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received:", request);
    
    if (request.type === 'SEARCH_HISTORY') {
        console.log('Searching history for:', request.query);
        
        // Return dummy data for testing
        const dummyResults = [
            {
                url: 'https://github.com/example/repo',
                title: 'GitHub - Example Repository',
                lastVisitTime: Date.now(),
                visitCount: 5
            },
            {
                url: 'https://google.com',
                title: 'Google',
                lastVisitTime: Date.now() - 1000,
                visitCount: 10
            },
            {
                url: 'https://stackoverflow.com/questions/test',
                title: 'Stack Overflow Question',
                lastVisitTime: Date.now() - 2000,
                visitCount: 3
            }
        ];
        
        // Filter dummy results if query provided
        let results = dummyResults;
        if (request.query) {
            results = dummyResults.filter(item => 
                item.url.toLowerCase().includes(request.query.toLowerCase()) ||
                item.title.toLowerCase().includes(request.query.toLowerCase())
            );
        }
        
        console.log('Returning', results.length, 'dummy results');
        sendResponse({ 
            type: 'SEARCH_RESULTS', 
            results: results
        });
        
        return true;
    }
    
    if (request.type === 'OPEN_URL') {
        browser.tabs.create({ url: request.url });
        return Promise.resolve({ success: true });
    }
});