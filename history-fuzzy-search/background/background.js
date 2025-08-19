console.log('History Fuzzy Search: Background script loaded');

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.type === 'SEARCH_HISTORY') {
    console.log('History search requested for query:', request.query);
    sendResponse({ type: 'SEARCH_RESULTS', results: [] });
  }
  
  return true;
});

browser.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    console.log('Keyboard shortcut triggered');
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_SEARCH_PALETTE' });
      }
    });
  }
});