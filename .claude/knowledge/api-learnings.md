# API & Integration Learnings

## Home Assistant WebSocket API

### Connection
- WebSocket URL: `ws://{HA_URL}/api/websocket`
- Auth: `{"type": "auth", "access_token": "TOKEN"}`
- After auth success, subscribe to state changes: `{"type": "subscribe_events", "event_type": "state_changed"}`

### Common Pitfalls
- Entity IDs are lowercase with underscores: `light.wohnzimmer_deckenlampe`
- Areas returned by HA don't include device mappings directly - need separate device registry call
- Media content URLs require proxy through backend (HA auth needed)

## FastAPI Backend

### Static Files
- Path must be calculated relative to `main.py` location, not CWD
- Use `Path(__file__).parent / "static"` pattern

### WebSocket Proxy
- Single connection to HA, fan-out to browser clients
- Must handle reconnection when HA restarts
- Message IDs need remapping between clients

## Frontend

### UI5 Web Components
- Import from `@ui5/webcomponents-react`
- Theme tokens available as CSS custom properties: `var(--sapBackgroundColor)`, `var(--sapTextColor)`, etc.
- Use `setTheme('sap_horizon_dark')` for dark mode

### Zustand Stores
- Use `immer` middleware for nested state updates
- Subscriptions with selectors for performance: `useStore(state => state.specificProp)`
- Entity store uses Map for O(1) entity lookups

### Vite Proxy
- Dev proxy config in `vite.config.ts`: `/api` → `http://localhost:5050`
- WebSocket proxy: `/ws` → `ws://localhost:5050`
