import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { listNewReplies } from "../services/inboxService";
import styles from "./InboxToast.module.css";

const LS_KEY = "qgame_lastSeenReplyAt";

/**
 * On app open, looks for replies to questions the current user has SENT that
 * arrived after the last time they were notified. Shows a brief toast then
 * auto-dismisses. Click → opens the inbox (Sent tab).
 *
 * The "last seen" timestamp lives in localStorage per device so it survives
 * refreshes but doesn't follow the user across devices — intentional, so each
 * device gets its own first-open notification.
 */
export default function InboxToast({ onOpenInbox }) {
  const { user } = useApp();
  const [visible, setVisible] = useState(false);
  const [replies, setReplies] = useState([]);

  // Check once per sign-in / app-open.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const since = localStorage.getItem(LS_KEY) ?? new Date(0).toISOString();
    listNewReplies(user.id, since).then((list) => {
      if (cancelled || list.length === 0) return;
      setReplies(list);
      setVisible(true);
      // Bump the high-water mark so the same replies don't toast again.
      const newest = list.reduce(
        (max, r) => (r.answeredAt > max ? r.answeredAt : max),
        since,
      );
      localStorage.setItem(LS_KEY, newest);
    });
    return () => { cancelled = true; };
  }, [user]);

  // Auto-dismiss after a generous window.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || replies.length === 0) return null;

  const names = [...new Set(replies.map((r) => r.recipientUsername).filter(Boolean))];
  const label = (() => {
    if (names.length === 0) return `${replies.length} new ${replies.length === 1 ? "reply" : "replies"}`;
    if (names.length === 1) return `@${names[0]} replied to your question`;
    if (names.length === 2) return `@${names[0]} and @${names[1]} replied`;
    return `@${names[0]} and ${names.length - 1} others replied`;
  })();

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <button
        className={styles.body}
        onClick={() => { setVisible(false); onOpenInbox?.(); }}
      >
        <span className={styles.icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 5l9 7 9-7v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
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
