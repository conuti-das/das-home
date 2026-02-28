/**
 * Resolves the base path for API and WebSocket calls.
 * Under HA Ingress the app is served at /api/hassio_ingress/<token>/
 * so all fetch/ws URLs must be prefixed with that path.
 */
function resolveBasePath(): string {
  const path = window.location.pathname;
  // Ingress pattern: /api/hassio_ingress/<token>/
  const match = path.match(/^(\/api\/hassio_ingress\/[^/]+)\//);
  if (match) return match[1];
  return "";
}

/** Cached base path (e.g. "/api/hassio_ingress/abc123" or "") */
export const basePath = resolveBasePath();

/** Prefix a path with the ingress base, e.g. apiUrl("/api/health") */
export function apiUrl(path: string): string {
  return basePath + path;
}

/** Build a WebSocket URL respecting the ingress base path */
export function wsUrl(path: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${basePath}${path}`;
}
