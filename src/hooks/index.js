/**
 * Q Game - Custom Hooks
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Tracks swipe gestures on a touch element.
 * Returns { onTouchStart, onTouchEnd } handlers to spread onto a div.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }) {
  const [startX, setStartX] = useState(null);

  const onTouchStart = useCallback((e) => {
    setStartX(e.touches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (startX === null) return;
      const delta = e.changedTouches[0].clientX - startX;
      if (delta < -threshold) onSwipeLeft?.();
      else if (delta > threshold) onSwipeRight?.();
      setStartX(null);
    },
    [startX, threshold, onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}

/**
 * Persists state to localStorage and keeps it in sync.
 * Drop-in replacement for useState that survives page refreshes.
 */
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}

/**
 * Returns true when the viewport is below a given width (default 768px).
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Keyboard shortcut support.
 * useKeyPress("ArrowRight", () => next())
 */
export function useKeyPress(targetKey, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (e.key === targetKey && !e.target.matches("textarea, input")) {
        handler(e);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [targetKey, handler]);
}
