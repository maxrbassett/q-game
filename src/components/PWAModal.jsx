import React from "react";
import styles from "./PWAModal.module.css";

export default function PWAModal({ onClose }) {
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h3 className={styles.title}>Save to Your Phone</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className={styles.intro}>
          Add Q Game to your home screen for a full-screen app experience — no app store required.
        </p>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
            <span>iPhone / iPad (Safari)</span>
          </div>
          <ol className={styles.steps}>
            <li>Open this page in <strong>Safari</strong></li>
            <li>Tap the <strong>Share</strong> button at the bottom of the screen <span className={styles.icon}>⬆</span></li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> in the top-right corner</li>
          </ol>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Android (Chrome)</span>
          </div>
          <ol className={styles.steps}>
            <li>Open this page in <strong>Chrome</strong></li>
            <li>Tap the <strong>three-dot menu</strong> <span className={styles.icon}>⋮</span> in the top-right corner</li>
            <li>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
        </div>

        <p className={styles.note}>
          Once installed, Q Game opens like a regular app — no browser bar, full screen.
        </p>
      </div>
    </div>
  );
}
