import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import LogoMark from "./LogoMark";
import styles from "./Header.module.css";

export default function Header({
  theme,
  onThemeToggle,
  onFavoritesOpen,
  onInstallOpen,
  onAccountOpen,
  onInboxOpen,
}) {
  const { favoriteQuestions, openView, user, unreadInboxCount } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (e) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [menuOpen]);

  useKeyPress("Escape", () => {
    if (menuOpen) setMenuOpen(false);
  });

  const isDark = theme === "dark";

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>
          <LogoMark size={28} strokeWidth={12} title="Q Game" />
        </span>
        <span className={styles.logoGame}>Game</span>
      </div>

      <div className={styles.actions}>
        {/* Theme toggle */}
        <button
          className={styles.iconBtn}
          onClick={onThemeToggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Inbox (signed-in only) */}
        {user && (
          <button
            className={styles.iconBtn}
            onClick={onInboxOpen}
            aria-label="Open inbox"
            title="Inbox"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 5l9 7 9-7M3 5v12a2 2 0 002 2h14a2 2 0 002-2V5M3 5h18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {unreadInboxCount > 0 && (
              <span className={styles.badge}>{unreadInboxCount}</span>
            )}
          </button>
        )}

        {/* Favorites */}
        <button
          className={styles.iconBtn}
          onClick={onFavoritesOpen}
          aria-label="View favorites"
          title="Favorites"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              stroke="currentColor"
              strokeWidth="1.8"
              fill={favoriteQuestions.length > 0 ? "var(--accent)" : "none"}
              strokeLinejoin="round"
            />
          </svg>
          {favoriteQuestions.length > 0 && (
            <span className={styles.badge}>{favoriteQuestions.length}</span>
          )}
        </button>

        {/* Hamburger menu */}
        <div className={styles.menuWrap} ref={menuWrapRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Menu"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              <button
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  openView("categories");
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Categories
              </button>
              <button
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  openView("tags");
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Tags
              </button>
              <button
                className={styles.menuItem}
                role="menuitem"
                title="Save to Home Screen"
                onClick={() => {
                  setMenuOpen(false);
                  onInstallOpen();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 16l-5-5h3V4h4v7h3l-5 5z" fill="currentColor" />
                  <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Get App
              </button>
              <button
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onAccountOpen();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {user ? "Account" : "Sign in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
