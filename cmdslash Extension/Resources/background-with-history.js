console.log('🚀 Background script with history API loaded!');

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received:", request);
    
    if (request.type === 'SEARCH_HISTORY') {
        console.log('Searching history for:', request.query);
        
        // Try to use the history API
        try {
            // Check if history API is available
            if (!browser.history) {
                console.error('History API not available!');
                sendResponse({ 
                    type: 'SEARCH_RESULTS', 
                    results: [],
                    error: 'History API not available'
                });
                return true;
            }
            
            // Search history with very broad parameters
            const searchParams = {
                text: '', // Empty string to get all history
                maxResults: 100,
                startTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
            };
            
            console.log('Calling history.search with params:', searchParams);
            
            browser.history.search(searchParams).then(historyItems => {
                console.log('History API returned', historyItems.length, 'items');
                
                // If we got history, filter it
                let results = historyItems;
                if (request.query && request.query.length > 0) {
                    const queryLower = request.query.toLowerCase();
                    results = historyItems.filter(item => 
                        (item.url && item.url.toLowerCase().includes(queryLower)) ||
                        (item.title && item.title.toLowerCase().includes(queryLower))
                    );
                    console.log('Filtered to', results.length, 'results');
                }
                
                // Take top 20 results
                results = results.slice(0, 20);
                
                // Map to our format
                const formattedResults = results.map(item => ({
                    url: item.url || '',
                    title: item.title || item.url || '',
                    lastVisitTime: item.lastVisitTime || Date.now(),
                    visitCount: item.visitCount || 1
                }));
                
                console.log('Sending', formattedResults.length, 'results to content script');
                sendResponse({ 
                    type: 'SEARCH_RESULTS', 
                    results: formattedResults
                });
            }).catch(error => {
                console.error('History search error:', error);
                console.error('Error details:', error.message, error.stack);
                
                // Fallback to dummy data on error
                const dummyResults = [
                    {
                        url: 'https://error.test/history-api-failed',
                        title: 'History API Error: ' + error.message,
                        lastVisitTime: Date.now(),
                        visitCount: 1
                    }
                ];
                
                sendResponse({ 
                    type: 'SEARCH_RESULTS', 
                    results: dummyResults,
                    error: error.message
                });
            });
        } catch (error) {
            console.error('Caught error:', error);
            sendResponse({ 
                type: 'SEARCH_RESULTS', 
                results: [],
                error: error.message
            });
        }
        
        return true; // Keep channel open for async response
    }
    
    if (request.type === 'OPEN_URL') {
        browser.tabs.create({ url: request.url });
        return Promise.resolve({ success: true });
    }
});