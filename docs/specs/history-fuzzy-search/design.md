# Technical Design: History Fuzzy Search

## Architecture Overview

### Extension Structure
```
history-fuzzy-search/
├── manifest.json           # Safari Web Extension manifest
├── background.js           # Background script for history access
├── content.js             # Content script for UI injection
├── popup/
│   ├── popup.html         # Search palette HTML
│   ├── popup.css          # Spotlight-style styling
│   └── popup.js           # Search logic and UI handling
├── icons/                 # Extension icons
└── lib/
    ├── fuzzy-search.js    # Fuzzy matching algorithm
    └── history-cache.js   # History caching and indexing
```

## Component Design

### 1. Background Script (background.js)
**Purpose**: Manages browser history access and message passing

**Responsibilities**:
- Listen for history API requests from content script
- Cache and index browser history for fast searching
- Handle permission requests
- Manage extension lifecycle

**Key Methods**:
```javascript
- initializeHistoryCache()
- searchHistory(query, options)
- refreshHistoryCache()
- handleMessage(request, sender, sendResponse)
```

### 2. Content Script (content.js)
**Purpose**: Inject and manage search UI in active tab

**Responsibilities**:
- Listen for cmd+/ keyboard shortcut
- Inject search palette into page
- Communicate with background script
- Handle result selection and navigation

**Key Methods**:
```javascript
- injectSearchPalette()
- showSearchPalette()
- hideSearchPalette()
- handleKeyboardShortcut(event)
- openUrlInNewTab(url)
```

### 3. Search Palette UI (popup/)
**Purpose**: Spotlight-style search interface

**Components**:
- Search input field
- Results list with keyboard navigation
- Result item rendering (favicon, title, URL)
- Loading/empty states

**Styling Approach**:
- CSS Grid for layout
- Backdrop blur effect
- Smooth animations (transform, opacity)
- Dark/light mode support

### 4. Fuzzy Search Engine (lib/fuzzy-search.js)
**Purpose**: Implement zoxide-like fuzzy matching

**Algorithm**:
```javascript
class FuzzySearcher {
  constructor(options = {
    weights: {
      exactEnd: 10,      // Exact match at URL end
      segment: 5,        // Match in URL segment
      domain: 2,         // Match in domain
      fuzzy: 1          // General fuzzy match
    }
  })
  
  search(query, items) {
    // 1. Tokenize query
    // 2. Score each item
    // 3. Sort by score and recency
    // 4. Return top N results
  }
  
  scoreUrl(url, query) {
    // Calculate weighted score based on match type
  }
}
```

### 5. History Cache (lib/history-cache.js)
**Purpose**: Efficient history storage and retrieval

**Data Structure**:
```javascript
{
  urls: Map<string, {
    url: string,
    title: string,
    visitCount: number,
    lastVisitTime: number,
    favicon: string
  }>,
  index: {
    domains: Map<string, Set<url>>,
    segments: Map<string, Set<url>>
  }
}
```

## Data Flow

```
1. User presses cmd+/
   ↓
2. Content script detects shortcut
   ↓
3. Content script injects/shows palette
   ↓
4. User types query
   ↓
5. Palette sends query to background script
   ↓
6. Background script searches cached history
   ↓
7. Fuzzy search ranks results
   ↓
8. Results sent back to palette
   ↓
9. Palette renders results
   ↓
10. User selects result (return/click)
    ↓
11. Content script opens URL in new tab
```

## API Interfaces

### Message Protocol
```javascript
// Request from content to background
{
  type: 'SEARCH_HISTORY',
  query: string,
  limit: number
}

// Response from background
{
  type: 'SEARCH_RESULTS',
  results: [{
    url: string,
    title: string,
    score: number,
    lastVisit: number,
    favicon: string
  }]
}
```

### Safari Extension APIs Used
- `browser.history.search()` - Get browsing history
- `browser.tabs.create()` - Open new tab
- `browser.runtime.sendMessage()` - Message passing
- `browser.storage.local` - Cache storage

## Performance Optimizations

### Caching Strategy
- Cache last 10,000 history entries on extension load
- Update cache incrementally every 5 minutes
- Use IndexedDB for persistence if cache > 5MB

### Search Optimizations
- Debounce search input (150ms)
- Limit initial results to 20 items
- Use Web Workers for heavy computations
- Pre-compute URL segments for faster matching

### UI Optimizations
- Virtual scrolling for large result sets
- Lazy load favicons
- Use CSS containment for result items
- RequestAnimationFrame for smooth animations

## Security Considerations

### Permissions
```json
{
  "permissions": [
    "history",
    "tabs",
    "storage"
  ]
}
```

### Data Protection
- No external network requests
- All processing happens locally
- Respect private browsing mode
- Clear cache on extension disable

## Error Handling

### Graceful Degradation
- If history API fails, show error message
- If cache corrupted, rebuild from scratch
- Handle malformed URLs safely
- Timeout long-running searches (1s max)

### User Feedback
- Show loading state during search
- Display "No results" for empty searches
- Indicate errors clearly in UI
- Provide keyboard shortcut hints

## Testing Strategy

### Unit Tests
- Fuzzy search algorithm correctness
- URL scoring logic
- Cache operations
- Message handling

### Integration Tests
- Extension installation
- Keyboard shortcut registration
- History API access
- Tab creation

### UI Tests
- Palette appearance/disappearance
- Keyboard navigation
- Result selection
- Dark/light mode

## Browser Compatibility

### Minimum Requirements
- Safari 14.0+
- macOS Big Sur (11.0+)
- WebExtensions API support

### Progressive Enhancement
- Fallback for older Safari versions
- Graceful handling of missing APIs
- Feature detection for advanced capabilities