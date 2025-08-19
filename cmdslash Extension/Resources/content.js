console.log('History Fuzzy Search: Content script loaded');

let searchPalette = null;
let searchInput = null;
let resultsList = null;
let selectedIndex = -1;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);
    
    if (request.type === 'TOGGLE_SEARCH_PALETTE') {
        toggleSearchPalette();
    }
});

function createSearchPalette() {
    const palette = document.createElement('div');
    palette.id = 'history-fuzzy-search-palette';
    palette.innerHTML = `
        <div class="hfs-backdrop"></div>
        <div class="hfs-modal">
            <input type="text" class="hfs-search-input" placeholder="Search history..." autocomplete="off">
            <div class="hfs-results-container">
                <ul class="hfs-results-list"></ul>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        #history-fuzzy-search-palette {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 999999;
            display: none;
        }
        
        #history-fuzzy-search-palette.visible {
            display: block;
        }
        
        .hfs-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        .hfs-modal {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            max-width: 90vw;
            background: white;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .hfs-search-input {
            width: 100%;
            padding: 20px;
            font-size: 18px;
            border: none;
            outline: none;
            background: transparent;
            font-family: -apple-system, system-ui, sans-serif;
        }
        
        .hfs-results-container {
            max-height: 400px;
            overflow-y: auto;
            border-top: 1px solid #e0e0e0;
        }
        
        .hfs-results-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .hfs-result-item {
            padding: 12px 20px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .hfs-result-item:hover,
        .hfs-result-item.selected {
            background: #f0f0f0;
        }
        
        .hfs-result-item.hfs-open-tab {
            border-left: 3px solid #4A90E2;
            padding-left: 17px;
        }
        
        .hfs-tab-indicator {
            font-size: 14px;
        }
        
        .hfs-result-title {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .hfs-result-url {
            font-size: 12px;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        @media (prefers-color-scheme: dark) {
            .hfs-modal {
                background: #2a2a2a;
                color: white;
            }
            
            .hfs-search-input {
                color: white;
            }
            
            .hfs-results-container {
                border-top-color: #444;
            }
            
            .hfs-result-item {
                border-bottom-color: #333;
            }
            
            .hfs-result-item:hover,
            .hfs-result-item.selected {
                background: #333;
            }
            
            .hfs-result-item.hfs-open-tab {
                border-left-color: #6AB7FF;
            }
            
            .hfs-result-title {
                color: #fff;
            }
            
            .hfs-result-url {
                color: #aaa;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(palette);
    
    searchPalette = palette;
    searchInput = palette.querySelector('.hfs-search-input');
    resultsList = palette.querySelector('.hfs-results-list');
    
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', handleKeyDown);
    
    palette.querySelector('.hfs-backdrop').addEventListener('click', hideSearchPalette);
}

function toggleSearchPalette() {
    if (!searchPalette) {
        createSearchPalette();
    }
    
    if (searchPalette.classList.contains('visible')) {
        hideSearchPalette();
    } else {
        showSearchPalette();
    }
}

function showSearchPalette() {
    if (!searchPalette) {
        createSearchPalette();
    }
    
    searchPalette.classList.add('visible');
    searchInput.value = '';
    searchInput.focus();
    resultsList.innerHTML = '';
    selectedIndex = -1;
    
    handleSearch();
}

function hideSearchPalette() {
    if (searchPalette) {
        searchPalette.classList.remove('visible');
    }
}

function handleSearch() {
    const query = searchInput.value.trim();
    console.log('Searching for:', query);
    
    if (query.length === 0) {
        browser.runtime.sendMessage({ 
            type: 'SEARCH_HISTORY', 
            query: '',
            limit: 20
        }).then(response => {
            console.log('Empty search response:', response);
            if (response && response.results) {
                displayResults(response.results);
            } else {
                console.error('Invalid response:', response);
                displayResults([]);
            }
        }).catch(error => {
            console.error('Search error:', error);
            displayResults([]);
        });
    } else {
        browser.runtime.sendMessage({ 
            type: 'SEARCH_HISTORY', 
            query: query,
            limit: 50
        }).then(response => {
            console.log('Search response:', response);
            if (response && response.results) {
                const results = fuzzyFilterResults(response.results, query);
                displayResults(results);
            } else {
                console.error('Invalid response:', response);
                displayResults([]);
            }
        }).catch(error => {
            console.error('Search error:', error);
            displayResults([]);
        });
    }
}

function fuzzyFilterResults(results, query) {
    const queryLower = query.toLowerCase();
    
    return results
        .map(result => {
            const url = result.url.toLowerCase();
            const title = (result.title || '').toLowerCase();
            
            let score = 0;
            
            if (url.endsWith(queryLower)) {
                score += 10;
            }
            
            const urlParts = url.split(/[\/\-_.]/);
            if (urlParts.some(part => part === queryLower)) {
                score += 5;
            }
            
            if (url.includes(queryLower)) {
                score += 2;
            }
            
            if (title.includes(queryLower)) {
                score += 1;
            }
            
            return { ...result, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.lastVisitTime - a.lastVisitTime;
        })
        .slice(0, 20);
}

function displayResults(results) {
    resultsList.innerHTML = '';
    selectedIndex = -1;
    
    if (results.length === 0) {
        resultsList.innerHTML = '<li class="hfs-result-item">No results found</li>';
        return;
    }
    
    results.forEach((result, index) => {
        const li = document.createElement('li');
        li.className = 'hfs-result-item';
        if (result.isOpenTab) {
            li.className += ' hfs-open-tab';
        }
        li.dataset.index = index;
        li.innerHTML = `
            <div class="hfs-result-title">
                ${result.isOpenTab ? '<span class="hfs-tab-indicator">📑</span> ' : ''}
                ${escapeHtml(result.title || result.url)}
            </div>
            <div class="hfs-result-url">${escapeHtml(result.url)}</div>
        `;
        
        li.addEventListener('click', () => openResult(result));
        resultsList.appendChild(li);
    });
}

function handleKeyDown(event) {
    const items = resultsList.querySelectorAll('.hfs-result-item');
    
    switch(event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelection(items);
            break;
            
        case 'Enter':
            event.preventDefault();
            if (selectedIndex >= 0 && items[selectedIndex]) {
                const url = items[selectedIndex].querySelector('.hfs-result-url').textContent;
                openResult({ url });
            } else if (items.length > 0) {
                const url = items[0].querySelector('.hfs-result-url').textContent;
                openResult({ url });
            }
            break;
            
        case 'Escape':
            event.preventDefault();
            hideSearchPalette();
            break;
    }
}

function updateSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function openResult(result) {
    if (result.isOpenTab) {
        // Switch to existing tab instead of opening new one
        browser.runtime.sendMessage({
            type: 'SWITCH_TO_TAB',
            tabId: result.tabId,
            windowId: result.windowId
        });
    } else {
        // Open in new tab
        browser.runtime.sendMessage({
            type: 'OPEN_URL',
            url: result.url
        });
    }
    hideSearchPalette();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('keydown', (event) => {
    // Support both Cmd+/ and Ctrl+/
    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        toggleSearchPalette();
    }
});