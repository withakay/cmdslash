# History Fuzzy Search - Safari Web Extension

A Safari Web Extension that provides fuzzy search capabilities for browser history with zoxide-like semantics and a Spotlight-style UI.

## Features

- **Cmd+/** keyboard shortcut to open search palette
- Fuzzy matching of URLs in browser history
- Smart ranking: exact endings > URL segments > domains
- Quick navigation with Return key opening top match in new tab
- Spotlight-style search interface

## Installation

1. Open Safari
2. Enable Developer menu: Safari → Preferences → Advanced → Show Develop menu
3. Allow unsigned extensions: Develop → Allow Unsigned Extensions
4. Open Safari → Preferences → Extensions
5. Click the "+" button and select the `history-fuzzy-search` folder

## Development

### Prerequisites
- Safari 14.0+
- macOS Big Sur (11.0+)
- Node.js for running tests

### Setup
```bash
npm install
```

### Testing
```bash
npm test        # Run tests once
npm test:watch  # Run tests in watch mode
```

### Project Structure
```
history-fuzzy-search/
├── manifest.json           # Extension manifest
├── background/             # Background scripts
├── content/               # Content scripts
├── popup/                 # Search palette UI
├── lib/                   # Shared libraries
├── icons/                 # Extension icons
└── tests/                 # Test files
```

## Usage

1. Press **Cmd+/** to open the search palette
2. Start typing to search your browser history
3. Use arrow keys to navigate results
4. Press **Return** to open the selected URL in a new tab
5. Press **ESC** to close the palette

## Permissions

The extension requires the following permissions:
- **history**: Access browser history for searching
- **tabs**: Create new tabs when opening results
- **storage**: Cache history data for performance
- **activeTab**: Inject search UI into current page