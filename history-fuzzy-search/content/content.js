console.log('History Fuzzy Search: Content script loaded');

let searchPaletteVisible = false;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TOGGLE_SEARCH_PALETTE') {
    toggleSearchPalette();
  }
});

function toggleSearchPalette() {
  if (searchPaletteVisible) {
    hideSearchPalette();
  } else {
    showSearchPalette();
  }
}

function showSearchPalette() {
  console.log('Showing search palette');
  searchPaletteVisible = true;
}

function hideSearchPalette() {
  console.log('Hiding search palette');
  searchPaletteVisible = false;
}

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === '/') {
    event.preventDefault();
    toggleSearchPalette();
  }
});