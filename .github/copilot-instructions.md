# AI Coding Agent Instructions - Mini SCADA HMI Dashboard

## Project Philosophy

This is a **zero-build, educational SCADA/HMI demo** designed for learning and prototyping. All code runs directly in browsers via `file://` protocol—no bundlers, no transpilers, no build steps. Keep it simple.

## Architecture Overview

### Module System: Global Scope + Strict Load Order
- **No ES6 modules**: Uses sequential `<script>` tags in [index.html](../index.html#L70-L81)
- **Critical load order** (dependencies first):
  1. `constants.js` → `fp.js` → `state.js` → `security.js`
  2. `data.js` → `utils.js` → `templates.js` → `router.js`
  3. `handlers.js` → `charts.js` → `app.js` → `tests.js`
- **Breaking this order breaks the app**—add new files only at the end or fix dependencies

### State Management: Redux-Like Immutability
- **Single source of truth**: [state.js](../assets/state.js) manages all mutable state via pure reducers
- **Action creators** (lines 59-128): Return plain objects, never mutate
- **Reducers** (lines 134-398): Return new state objects using spread operators
- **Never directly modify** `machines`, `events`, `downtime`, etc.—always dispatch actions

Example pattern:
```javascript
// ❌ WRONG: Direct mutation
machines[0].status = 'DOWN';

// ✅ CORRECT: Dispatch action
dispatch(createSetMachineStatusAction(1, MACHINE_STATUS.DOWN));
```

### View Rendering: Hash-Based SPA Router
- **Router** ([router.js](../assets/router.js)): Parses `window.location.hash` to determine view
- **Templates** ([templates.js](../assets/templates.js)): Pure functions returning HTML strings
- **App.js** ([app.js](../assets/app.js)): Orchestrates rendering via `renderCurrentView()`
- **Sticky action toolbar**: Context-sensitive buttons per view (see [templates.js#L25-L45](../assets/templates.js#L25-L45))

Views: `#/overview`, `#/machine/{id}`, `#/runbooks`, `#/commissioning`, `#/help`

## Critical Coding Conventions

### 1. Pure Functions + Functional Programming
- [fp.js](../assets/fp.js) provides `pipe`, `compose`, `curry` primitives—use them for data transformations
- All template functions and reducers **must be pure** (no side effects, deterministic)
- Mark pure functions with `@pure` JSDoc tag

### 2. Security: Always Sanitize User Input
- Use `escapeHtml()` from [security.js](../assets/security.js#L40) when inserting user content into HTML
- Use `sanitizeInput()` to strip HTML tags from form inputs
- Example: [handlers.js#L55](../assets/handlers.js#L55) shows validation pattern

### 3. Constants Over Magic Numbers
- **All** config values live in [config/constants.js](../assets/config/constants.js)
- Use `SIMULATION.INTERVAL_MS`, `TIME.MS_PER_HOUR`, `SEVERITY.ALARM`, etc.
- Never hardcode `2500`, `'RUN'`, or `'ALARM'`—always reference constants

### 4. Accessibility (A11y) First
- Use ARIA labels: `role="navigation"`, `aria-label`, `aria-live="polite"`
- Screen reader announcer: `announceToScreenReader()` in [utils.js](../assets/utils.js)
- All interactive elements need tooltips via `data-tippy-content`

### 5. Tailwind CSS Class Patterns
- Use utility classes: `bg-blue-600 hover:bg-blue-700 text-white`
- Dark mode: Add `dark:` variants (e.g., `dark:bg-gray-900`)
- Status colors: Use `STATUS_COLORS[status]` from constants, not hardcoded colors

## Key Development Workflows

### Running the App
```bash
# Just open the file—no server needed for basic usage
open index.html  # macOS
xdg-open index.html  # Linux

# OR run local server (for testing CORS-sensitive features)
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### Testing
```bash
# Open with test flag (no test runner needed)
open index.html?test=1
# Check browser console for ✅/❌ results
```
- Tests in [tests.js](../assets/tests.js) use custom `assert()` function
- Add tests for new reducers/utilities at end of file

### Simulation Mode
- Toggle via Overview toolbar button
- Generates random events every `SIMULATION.INTERVAL_MS` (2.5s)
- Implementation: [utils.js#L200-L250](../assets/utils.js) (approx)

### Persistence
- LocalStorage for commissioning checklist state
- Export/import via JSON (see [handlers.js](../assets/handlers.js) for `exportChecklist()`)

## Common Tasks

### Adding a New Machine
1. Edit [data.js](../assets/data.js): Add to `machines` array
2. Follow existing schema: `{id, name, status, lastHeartbeat, healthScore}`

### Creating a Runbook
1. Edit [data.js](../assets/data.js): Add to `runbooks` array
2. Format: `{code: 'XXXX-NNN', title, symptoms: [...], steps: [...]}`
3. Code must match regex `/^[A-Z]{2,6}-\d{3}$/`

### Adding a New View
1. Define constant in [constants.js](../assets/config/constants.js) `VIEWS` object
2. Add route handler in [router.js](../assets/router.js) `parseRoute()`
3. Create template function in [templates.js](../assets/templates.js)
4. Update switch statement in [app.js](../assets/app.js) `renderCurrentView()`
5. Add navigation link in [index.html](../index.html)

### Adding a Chart
1. Use Chart.js (loaded via CDN in [index.html](../index.html))
2. See [charts.js](../assets/charts.js) for examples (doughnut, bar charts)
3. Call `renderCharts()` after DOM updates with `setTimeout(renderCharts, TIME.CHART_RENDER_DELAY_MS)`

## Anti-Patterns to Avoid

❌ **Don't** import npm packages—use CDN only  
❌ **Don't** add build tools (webpack, Vite, etc.)—defeats zero-build philosophy  
❌ **Don't** use ES6 modules (`import/export`)—breaks `file://` protocol  
❌ **Don't** directly manipulate DOM in templates—return HTML strings only  
❌ **Don't** store secrets or real credentials—this is a demo/learning project  
❌ **Don't** use jQuery or heavy frameworks—keep the codebase ~800 lines  

## File Size Budget

Target: **~800 total lines** across all `assets/*.js` files. Before adding features, consider:
- Can this be done with existing utilities?
- Is this essential for the demo's educational purpose?
- Would this bloat the codebase unnecessarily?

## When You're Stuck

1. **Script load order issues?** Check [index.html](../index.html#L70-L81) dependencies
2. **State not updating?** Verify you're using action creators from [state.js](../assets/state.js)
3. **Styling broken?** Ensure Tailwind CDN loaded and check `dark:` variants
4. **Charts not rendering?** Add `TIME.CHART_RENDER_DELAY_MS` timeout for DOM settlement
5. **XSS concerns?** Use `escapeHtml()` or `sanitizeInput()` from [security.js](../assets/security.js)

For more context, see [README.md](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).
