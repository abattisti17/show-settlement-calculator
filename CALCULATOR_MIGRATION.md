# Calculator Page Design System Migration

## Component Swaps

| Before | After |
|--------|-------|
| `<main className="container">` | `<AppShell>` + `<div className="calculator-container">` |
| User header (email + Back/Save/Sign Out) | `AppShell` nav + `PageHeader` with action (Back to Dashboard, Save Show) |
| `<header className="header">` with h1 + p | `<PageHeader>` with title + description |
| `<input>` (showName, artistName, ticketPrice, etc.) | `<Input>` with label, id, name, value, onChange |
| `<select>` (dealType) | `<Select>` with label, id, name, value, onChange |
| Calculate button | `<Button variant="primary" size="lg">` |
| Save Show button | `<Button variant="primary" size="sm">` |
| Print/PDF button | `<Button variant="secondary">` |
| Back to Dashboard button | `<Button variant="ghost" size="sm">` |
| Sign Out button | `AppShell` signOutAction (server form) |
| Paywall "View Plans & Subscribe" | `<Button variant="primary" size="lg">` |
| Form section | `<Card variant="default" padding="lg">` |
| Results card | `<Card variant="elevated" padding="lg">` with className="results-card" |
| Paywall card | `<Card variant="elevated" padding="lg">` with className="paywall-card" |
| Footer content card | `<Card variant="default" padding="lg">` with calculator-footer-card |
| Loading state | `calculator-loading` (in calculator.css) |
| Save status message | `calculator-save-status` (in calculator.css) |
| Error message | `calculator-save-status error` |

## Dead CSS Classes in globals.css

The following classes are **no longer used by the calculator page** after migration. They may still be used by other pages (login, dashboard, share page, etc.).

### Calculator-specific (now dead for calculator only)
- `.container` — replaced by `calculator-container` in calculator.css
- `.user-header`, `.user-header-left`, `.user-header-actions` — replaced by AppShell + PageHeader
- `.save-show-btn`, `.dashboard-link-btn`, `.logout-btn` — replaced by Button components
- `.header`, `.header h1`, `.header p` — replaced by PageHeader
- `.section`, `.section-title` — replaced by Card + calculator-section-title
- `.form-group`, `.form-group label`, `.form-group input`, `.form-group select`, `.form-row` — replaced by Input/Select components
- `.calculate-btn` — replaced by Button
- `.print-btn` — replaced by Button with className="calculator-print-btn"
- `.results-card` (base styles) — replaced by Card; h2 styles moved to calculator.css
- `.result-row` (base styles) — replaced by calculator-result-row; kept for print compatibility
- `.paywall`, `.paywall-card`, `.paywall-features`, `.paywall-feature`, `.paywall-btn` — replaced by Card + Button; paywall-description moved to calculator.css
- `.loading-state` — replaced by calculator-loading
- `.save-status-message` — replaced by calculator-save-status
- `.error-message` (calculator context) — replaced by calculator-save-status error

### Still used
- `.footer-section`, `.footer-content`, `.footer-photo`, `.footer-text`, etc. — replaced by calculator-footer-section + Card + calculator-footer-* in calculator.css
- `.results-section`, `.results-card`, `.result-row`, `.artist-name-display` — print styles + results layout
- `.share-link-*` — ShareLinkManager component
- Shared utility block (`.btn-primary`, etc.) — other pages still reference these

## New Files
- `app/calculator.css` — calculator layout, form grid, result rows, paywall, save status
