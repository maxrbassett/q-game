import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import { getChoices } from "../data/choices";
import {
  listReceived,
  listSent,
  markInboxRead,
  answerSentQuestion,
} from "../services/inboxService";
import styles from "./InboxDrawer.module.css";

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function InboxDrawer({ onClose }) {
  const { user, refreshInbox, unreadInboxCount } = useApp();
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useKeyPress("Escape", onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [r, s] = await Promise.all([listReceived(user.id), listSent(user.id)]);
      if (cancelled) return;
      setReceived(r);
      setSent(s);
      setLoading(false);
      // Bulk-mark received as read once the drawer's been shown.
      await markInboxRead(user.id);
      refreshInbox?.();
    }
    load();
    return () => { cancelled = true; };
  }, [user, refreshInbox]);

  if (!user) return null;

  const items = tab === "received" ? received : sent;
  const empty = tab === "received"
    ? "No questions sent to you yet."
    : "You haven't sent any questions yet.";

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Inbox</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={tab === "received"}
            className={`${styles.tab} ${tab === "received" ? styles.tabActive : ""}`}
            onClick={() => { setTab("received"); setExpandedId(null); }}
          >
            Received
            {unreadInboxCount > 0 && (
              <span className={styles.tabCount}>{unreadInboxCount}</span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={tab === "sent"}
            className={`${styles.tab} ${tab === "sent" ? styles.tabActive : ""}`}
            onClick={() => { setTab("sent"); setExpandedId(null); }}
          >
            Sent
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading…</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>✉</span>
            <p>{empty}</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {items.map((row) => (
              <InboxRow
                key={row.id}
                row={row}
                mode={tab}
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
                onAnswered={async (payload) => {
                  await answerSentQuestion(row.id, payload);
                  setReceived((prev) =>
                    prev.map((r) =>
                      r.id === row.id
                        ? {
                            ...r,
                            answerText: payload.text ?? "",
                            answerChoice: payload.choice ?? null,
                            answeredAt: new Date().toISOString(),
                          }
                        : r,
                    ),
                  );
                  refreshInbox?.();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Row component ───────────────────────────────────────────────────────────

function InboxRow({ row, mode, expanded, onToggle, onAnswered }) {
  const isReceived = mode === "received";
  const counterpartUsername = isReceived ? row.senderUsername : row.recipientUsername;
  const answered = !!row.answeredAt;
  const status = isReceived
    ? answered ? "Answered" : "New"
    : answered ? "Replied" : "Waiting";

  return (
    <li className={`${styles.row} ${expanded ? styles.rowExpanded : ""}`}>
      <button className={styles.rowHeader} onClick={onToggle}>
        <div className={styles.rowTop}>
          <span className={styles.rowUser}>
            {isReceived ? "from " : "to "}
            <span className={styles.rowUsername}>@{counterpartUsername ?? "unknown"}</span>
          </span>
          <span className={`${styles.rowStatus} ${answered ? styles.rowStatusDone : ""}`}>
            {status}
          </span>
        </div>
        <p className={styles.rowQuestion}>{row.question?.text ?? "(question unavailable)"}</p>
        <div className={styles.rowMeta}>
          <span>{row.question?.category}</span>
          <span>·</span>
          <span>{timeAgo(row.sentAt)}</span>
        </div>
      </button>

      {expanded && (
        <div className={styles.rowBody}>
          {row.note && (
            <div className={styles.noteBlock}>
              <span className={styles.noteLabel}>{isReceived ? "Their note" : "Your note"}</span>
              <p className={styles.noteText}>{row.note}</p>
            </div>
          )}

          {isReceived && (
            <ReceivedAnswerForm row={row} onAnswered={onAnswered} />
          )}

          {!isReceived && answered && (
            <div className={styles.replyBlock}>
              <span className={styles.replyLabel}>
                @{row.recipientUsername}'s reply
              </span>
              {row.answerChoice && (
                <div className={styles.replyChoice}>{row.answerChoice}</div>
              )}
              {row.answerText && <p className={styles.replyText}>{row.answerText}</p>}
            </div>
          )}

          {!isReceived && !answered && (
            <p className={styles.waitingText}>Waiting for them to reply.</p>
          )}
        </div>
      )}
    </li>
  );
}

// ── Answer form (when expanding a received row) ──────────────────────────────

function ReceivedAnswerForm({ row, onAnswered }) {
  const choices = row.question ? getChoices(row.question) : null;
  const hasChoices = !!choices;
  const [text, setText] = useState(row.answerText ?? "");
  const [choice, setChoice] = useState(row.answerChoice ?? null);
  const [saving, setSaving] = useState(false);

  const answered = !!row.answeredAt;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onAnswered({ text, choice });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.answerForm}>
      {hasChoices && (
        <div
          className={`${styles.choices} ${
            choices.type === "scale" ? styles.choicesScale :
            choices.type === "binary" ? styles.choicesBinary :
            styles.choicesMulti
          }`}
          role="radiogroup"
        >
          {choices.options.map((opt) => {
            const active = choice === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.choiceBtn} ${active ? styles.choiceBtnActive : ""}`}
                onClick={() => setChoice(choice === opt ? null : opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      <textarea
        className={styles.textarea}
        placeholder={hasChoices ? "Additional thoughts (optional)…" : "Type your answer…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />

      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving || (!text.trim() && !choice)}
      >
        {saving ? "Sending…" : answered ? "Update reply" : "Send reply"}
      </button>
    </div>
  );
}
