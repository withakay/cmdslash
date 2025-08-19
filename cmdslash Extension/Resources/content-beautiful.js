console.log('🎨 Beautiful History Search loaded');

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
    palette.id = 'cmdslash-palette';
    palette.innerHTML = `
        <div class="cmdslash-backdrop"></div>
        <div class="cmdslash-modal">
            <div class="cmdslash-header">
                <svg class="cmdslash-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" class="cmdslash-search-input" placeholder="Search tabs and history..." autocomplete="off" spellcheck="false">
                <kbd class="cmdslash-esc">ESC</kbd>
            </div>
            <div class="cmdslash-results-container">
                <div class="cmdslash-section" id="tabs-section" style="display: none;">
                    <div class="cmdslash-section-header">Open Tabs</div>
                    <ul class="cmdslash-results-list" id="tabs-list"></ul>
                </div>
                <div class="cmdslash-section" id="history-section" style="display: none;">
                    <div class="cmdslash-section-header">History</div>
                    <ul class="cmdslash-results-list" id="history-list"></ul>
                </div>
                <div class="cmdslash-empty" style="display: none;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <p>No results found</p>
                </div>
            </div>
            <div class="cmdslash-footer">
                <div class="cmdslash-footer-item">
                    <kbd>↑↓</kbd> Navigate
                </div>
                <div class="cmdslash-footer-item">
                    <kbd>↵</kbd> Open
                </div>
                <div class="cmdslash-footer-item">
                    <kbd>⌘/</kbd> Toggle Search
                </div>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        * {
            box-sizing: border-box;
        }
        
        #cmdslash-palette {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2147483647;
            display: none;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        #cmdslash-palette.visible {
            display: block;
            animation: cmdslash-fade-in 0.2s ease;
        }
        
        @keyframes cmdslash-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .cmdslash-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
        
        .cmdslash-modal {
            position: absolute;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            width: 640px;
            max-width: calc(100vw - 32px);
            max-height: 60vh;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 
                0 24px 48px -12px rgba(0, 0, 0, 0.18),
                0 0 0 1px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: cmdslash-slide-up 0.2s ease;
        }
        
        @keyframes cmdslash-slide-up {
            from { 
                opacity: 0;
                transform: translateX(-50%) translateY(10px);
            }
            to { 
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        .cmdslash-header {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            gap: 12px;
        }
        
        .cmdslash-search-icon {
            color: #6b7280;
            flex-shrink: 0;
        }
        
        .cmdslash-search-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 16px;
            font-weight: 400;
            color: #111827;
            font-family: inherit;
            caret-color: #111827;
        }
        
        .cmdslash-search-input::placeholder {
            color: #9ca3af;
        }
        
        .cmdslash-esc {
            padding: 2px 6px;
            background: rgba(0, 0, 0, 0.04);
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            color: #6b7280;
            border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .cmdslash-results-container {
            flex: 1;
            overflow-y: auto;
            overscroll-behavior: contain;
        }
        
        .cmdslash-section {
            padding: 8px 0;
        }
        
        .cmdslash-section-header {
            padding: 8px 16px 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
        }
        
        .cmdslash-results-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .cmdslash-result-item {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            cursor: pointer;
            transition: background-color 0.1s ease;
            gap: 12px;
            position: relative;
        }
        
        .cmdslash-result-item:hover {
            background: rgba(0, 0, 0, 0.02);
        }
        
        .cmdslash-result-item.selected {
            background: rgba(59, 130, 246, 0.08);
        }
        
        .cmdslash-result-item.selected::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #3b82f6;
        }
        
        .cmdslash-favicon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.04);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
        }
        
        .cmdslash-favicon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .cmdslash-result-content {
            flex: 1;
            min-width: 0;
        }
        
        .cmdslash-result-title {
            font-size: 14px;
            font-weight: 500;
            color: #111827;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .cmdslash-result-url {
            font-size: 12px;
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .cmdslash-result-badge {
            padding: 2px 6px;
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .cmdslash-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 48px;
            color: #9ca3af;
            gap: 12px;
        }
        
        .cmdslash-empty p {
            margin: 0;
            font-size: 14px;
        }
        
        .cmdslash-footer {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            gap: 20px;
            background: rgba(0, 0, 0, 0.02);
        }
        
        .cmdslash-footer-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #6b7280;
        }
        
        .cmdslash-footer-item kbd {
            padding: 2px 4px;
            background: white;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
            color: #374151;
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
        }
        
        @media (prefers-color-scheme: dark) {
            .cmdslash-modal {
                background: #18181b;
                box-shadow: 
                    0 24px 48px -12px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
            }
            
            .cmdslash-header {
                border-bottom-color: rgba(255, 255, 255, 0.1);
            }
            
            .cmdslash-search-input {
                color: #f3f4f6;
            }
            
            .cmdslash-search-input::placeholder {
                color: #6b7280;
            }
            
            .cmdslash-esc {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
                color: #9ca3af;
            }
            
            .cmdslash-section-header {
                color: #9ca3af;
            }
            
            .cmdslash-result-item:hover {
                background: rgba(255, 255, 255, 0.02);
            }
            
            .cmdslash-result-item.selected {
                background: rgba(59, 130, 246, 0.15);
            }
            
            .cmdslash-favicon {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .cmdslash-result-title {
                color: #f3f4f6;
            }
            
            .cmdslash-result-url {
                color: #9ca3af;
            }
            
            .cmdslash-footer {
                background: rgba(255, 255, 255, 0.02);
                border-top-color: rgba(255, 255, 255, 0.1);
            }
            
            .cmdslash-footer-item {
                color: #9ca3af;
            }
            
            .cmdslash-footer-item kbd {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
                color: #d1d5db;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(palette);
    
    searchPalette = palette;
    searchInput = palette.querySelector('.cmdslash-search-input');
    resultsList = palette.querySelector('.cmdslash-results-list');
    
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', handleKeyDown);
    
    palette.querySelector('.cmdslash-backdrop').addEventListener('click', hideSearchPalette);
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
    
    browser.runtime.sendMessage({ 
        type: 'SEARCH_HISTORY', 
        query: query,
        limit: 50
    }).then(response => {
        console.log('Search response:', response);
        if (response && response.results) {
            displayResults(response.results, query);
        }
    }).catch(error => {
        console.error('Search error:', error);
        displayResults([]);
    });
}

function displayResults(results, query) {
    const tabsSection = document.getElementById('tabs-section');
    const historySection = document.getElementById('history-section');
    const emptyState = document.querySelector('.cmdslash-empty');
    const tabsList = document.getElementById('tabs-list');
    const historyList = document.getElementById('history-list');
    
    // Clear previous results
    tabsList.innerHTML = '';
    historyList.innerHTML = '';
    selectedIndex = -1;
    
    if (results.length === 0) {
        tabsSection.style.display = 'none';
        historySection.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Separate tabs and history
    const tabs = results.filter(r => r.isOpenTab);
    const history = results.filter(r => !r.isOpenTab);
    
    // Display tabs
    if (tabs.length > 0) {
        tabsSection.style.display = 'block';
        tabs.forEach((result, index) => {
            const li = createResultItem(result, index);
            tabsList.appendChild(li);
        });
    } else {
        tabsSection.style.display = 'none';
    }
    
    // Display history
    if (history.length > 0) {
        historySection.style.display = 'block';
        history.forEach((result, index) => {
            const li = createResultItem(result, tabs.length + index);
            historyList.appendChild(li);
        });
    } else {
        historySection.style.display = 'none';
    }
}

function createResultItem(result, index) {
    const li = document.createElement('li');
    li.className = 'cmdslash-result-item';
    li.dataset.index = index;
    
    const favicon = document.createElement('div');
    favicon.className = 'cmdslash-favicon';
    
    if (result.favicon) {
        const img = document.createElement('img');
        img.src = result.favicon;
        img.onerror = () => {
            img.style.display = 'none';
            favicon.textContent = getDomainInitial(result.url);
        };
        favicon.appendChild(img);
    } else {
        favicon.textContent = getDomainInitial(result.url);
    }
    
    const content = document.createElement('div');
    content.className = 'cmdslash-result-content';
    content.innerHTML = `
        <div class="cmdslash-result-title">${escapeHtml(result.title || result.url)}</div>
        <div class="cmdslash-result-url">${escapeHtml(formatUrl(result.url))}</div>
    `;
    
    li.appendChild(favicon);
    li.appendChild(content);
    
    if (result.isOpenTab) {
        const badge = document.createElement('span');
        badge.className = 'cmdslash-result-badge';
        badge.textContent = 'Tab';
        li.appendChild(badge);
    }
    
    li.addEventListener('click', () => openResult(result));
    
    return li;
}

function getDomainInitial(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname.charAt(0).toUpperCase();
    } catch {
        return '?';
    }
}

function formatUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname;
    } catch {
        return url;
    }
}

function handleKeyDown(event) {
    const items = document.querySelectorAll('.cmdslash-result-item');
    
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
                items[selectedIndex].click();
            } else if (items.length > 0) {
                items[0].click();
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
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('selected');
        }
    });
}

function openResult(result) {
    if (result.isOpenTab) {
        browser.runtime.sendMessage({
            type: 'SWITCH_TO_TAB',
            tabId: result.tabId,
            windowId: result.windowId
        });
    } else {
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
    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        toggleSearchPalette();
    }
});