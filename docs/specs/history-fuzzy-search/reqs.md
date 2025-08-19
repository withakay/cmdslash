# Requirements: History Fuzzy Search

## Module Overview
Safari web extension for fuzzy searching browser history with zoxide-like semantics and Spotlight-style UI.

## User Stories
<!-- Format: As a [role], I want [feature], so that [benefit] -->

### Core Functionality
- **US-001**: As a Safari user, I want to press cmd+/ to open a search palette, so that I can quickly access my browsing history
- **US-002**: As a user, I want to type partial URL fragments and get fuzzy matches, so that I can find pages without remembering exact URLs
- **US-003**: As a user, I want results ordered by recency and relevance, so that I see the most useful matches first
- **US-004**: As a user, I want to press return to open the top match in a new tab, so that I can quickly navigate to my desired page

### Search Features
- **US-005**: As a user, I want exact matches to URL endings weighted highest, so that specific pages appear first
- **US-006**: As a user, I want URL segment matches weighted second, so that path-based searches work intuitively
- **US-007**: As a user, I want domain matches weighted third, so that site-level searches are still effective

## Acceptance Criteria
<!-- Format: GIVEN [context], WHEN [action], THEN [outcome] -->

### Search Palette
- **AC-001**: GIVEN the extension is installed, WHEN I press cmd+/, THEN a Spotlight-style search palette appears centered on screen
- **AC-002**: GIVEN the search palette is open, WHEN I press ESC, THEN the palette closes without action
- **AC-003**: GIVEN the search palette is open, WHEN I click outside, THEN the palette closes

### Fuzzy Search
- **AC-004**: GIVEN I have visited "github.com/foo/bar", WHEN I type "bar", THEN this URL appears in results
- **AC-005**: GIVEN multiple matches exist, WHEN I search, THEN results show with most recent first
- **AC-006**: GIVEN I type a query, WHEN results update, THEN they appear within 100ms

### Result Ranking
- **AC-007**: GIVEN URLs ending with search term, WHEN displayed, THEN they appear before partial matches
- **AC-008**: GIVEN URL segments match search term, WHEN displayed, THEN they appear before domain-only matches
- **AC-009**: GIVEN domain contains search term, WHEN displayed, THEN it appears after more specific matches

### Navigation
- **AC-010**: GIVEN search results are shown, WHEN I press return, THEN top result opens in new tab
- **AC-011**: GIVEN search results are shown, WHEN I use arrow keys, THEN selection moves through results
- **AC-012**: GIVEN a result is selected, WHEN I press return, THEN that specific result opens in new tab

## Non-Functional Requirements

### Performance
- **NFR-001**: Search results must update within 100ms of typing
- **NFR-002**: Extension must handle history with 10,000+ entries efficiently
- **NFR-003**: Memory usage must stay under 50MB during normal operation

### User Experience
- **NFR-004**: UI must be visually similar to macOS Spotlight
- **NFR-005**: Animation transitions must be smooth (60fps)
- **NFR-006**: Extension must work with Safari 14.0+

### Security
- **NFR-007**: Extension must only access browser history API
- **NFR-008**: No external network requests allowed
- **NFR-009**: All data processing must occur locally

## Edge Cases
- **EC-001**: Handle empty search query gracefully (show recent history)
- **EC-002**: Handle no matches found (show appropriate message)
- **EC-003**: Handle very long URLs (truncate display intelligently)
- **EC-004**: Handle duplicate URLs in history (show only most recent)
- **EC-005**: Handle special characters in search queries
- **EC-006**: Handle international/unicode URLs correctly

## Constraints
- Must be a Safari Web Extension (not legacy extension)
- Must follow Apple's extension guidelines
- Must be installable without admin privileges
- Cannot modify browser history
- Must respect private browsing mode (no access to private history)

## Dependencies
- Safari 14.0+ browser history API
- Safari Web Extension APIs
- No external libraries for core functionality (vanilla JS preferred)

## Out of Scope
- Cross-browser support (Chrome, Firefox, etc.)
- Cloud sync of search preferences
- History modification or deletion
- Bookmark searching (history only)
- Search suggestions from external sources