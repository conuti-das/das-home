import { useEffect, useState } from "react";

/**
 * Reactive CSS media-query hook. Returns true while `query` matches.
 * SSR-safe: returns false when `window.matchMedia` is unavailable.
 *
 * Single source of truth for "is this a phone-sized viewport" across the
 * grid renderers. Do NOT derive mobile state from measured column counts —
 * those can't report a single column until the matching CSS breakpoint exists.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
