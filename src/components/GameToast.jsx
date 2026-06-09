import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import styles from "./GameToast.module.css";

/**
 * On app open, if the user has rounds waiting on their move, nudges them with a
 * dismissible toast. Click → opens Games. Shows once per app session (a ref
 * gate) so it doesn't re-fire on every re-render; the header badge carries the
 * count the rest of the time.
 */
export default function GameToast({ onOpenGames }) {
  const { user, authReady, yourTurnCount } = useApp();
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    if (!user || !authReady) return;
    if (yourTurnCount > 0) {
      shownRef.current = true;
      setVisible(true);
    }
  }, [user, authReady, yourTurnCount]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || yourTurnCount === 0) return null;

  const label =
    yourTurnCount === 1
      ? "It's your turn in a game"
      : `It's your turn in ${yourTurnCount} games`;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <button
        className={styles.body}
        onClick={() => { setVisible(false); onOpenGames?.(); }}
      >
        <span className={styles.icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
            <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" />
          </svg>
        </span>
        <span className={styles.text}>{label}</span>
        <span className={styles.chevron}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      <button
        className={styles.dismiss}
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
