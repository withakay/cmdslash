// Simple test content script
console.log('🚀 History Fuzzy Search: Test content script loaded!');

// Test with a simple alert first
document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        console.log('🔥 Keyboard shortcut detected!');
        alert('History Fuzzy Search: Keyboard shortcut works!');
    }
});

// Also listen for the browser command
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📨 Content script received message:", request);
    if (request.type === 'TOGGLE_SEARCH_PALETTE') {
        alert('History Fuzzy Search: Command received from background!');
    }
});