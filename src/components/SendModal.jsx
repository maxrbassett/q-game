import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import { listUsers, startRound } from "../services/gameService";
import { getChoices } from "../data/choices";
import styles from "./SendModal.module.css";

export default function SendModal({ question, answer, onClose }) {
  const { user } = useApp();
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [focused, setFocused] = useState(false);
  const [picked, setPicked] = useState(null); // { id, username, displayName }
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState(null);
  const inputRef = useRef(null);

  const choices = question ? getChoices(question) : null;
  const answerLabel =
    answer?.choice ??
    (answer?.text?.trim() ? `“${answer.text.trim()}”` : "—");

  useKeyPress("Escape", onClose);

  // Load the full user list once so the dropdown can show everyone up front.
  useEffect(() => {
    let cancelled = false;
    listUsers(user?.id).then((list) => {
      if (cancelled) return;
      setAllUsers(list);
      setLoadingUsers(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Filter the loaded list client-side as you type (matches username or name).
  const q = query.trim().toLowerCase();
  const filtered = q
    ? allUsers.filter(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          (p.displayName && p.displayName.toLowerCase().includes(q)),
      )
    : allUsers;

  const handlePick = (person) => {
    setPicked(person);
    setQuery(`@${person.username}`);
    setFocused(false);
  };

  const handleClearPicked = () => {
    setPicked(null);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!picked || !question) return;
    setSending(true);
    setError("");
    try {
      await startRound(user.id, picked.id, question.id, answer ?? {}, note);
      setSentTo(picked);
    } catch (err) {
      setError(err?.message ?? "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={styles.modal} role="dialog" aria-label="Sent">
          <div className={styles.handle} />
          <div className={styles.successBlock}>
            <div className={styles.successIcon}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className={styles.successText}>
              Round started with <span className={styles.username}>@{sentTo.username}</span>
            </p>
            <p className={styles.successSub}>
              They'll guess your answer, then it comes back for you to guess theirs.
            </p>
            <button className={styles.primaryBtn} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-label="Send question">
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>Start a round</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {question && (
          <div className={styles.preview}>
            <div className={styles.previewCategory}>{question.category}</div>
            <p className={styles.previewText}>{choices?.displayText ?? question.text}</p>
            <div className={styles.previewAnswer}>
              <span className={styles.previewAnswerLabel}>Your answer (they'll guess it)</span>
              <span className={styles.previewAnswerValue}>{answerLabel}</span>
            </div>
          </div>
        )}

        <label className={styles.label}>To</label>
        {picked ? (
          <div className={styles.pickedRow}>
            <span className={styles.pickedChip}>
              <span className={styles.username}>@{picked.username}</span>
              {picked.displayName && (
                <span className={styles.pickedName}>· {picked.displayName}</span>
              )}
            </span>
            <button className={styles.changeBtn} onClick={handleClearPicked}>
              Change
            </button>
          </div>
        ) : (
          <>
            <div className={styles.inputWrap}>
              <span className={styles.atSign}>@</span>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="search or pick a friend"
                value={query.replace(/^@/, "")}
                onChange={(e) => setQuery(e.target.value.toLowerCase())}
                onFocus={() => setFocused(true)}
                // Delay so a click on a result registers before the list closes.
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {focused && (
              <div className={styles.results}>
                {loadingUsers && <div className={styles.resultsHint}>Loading…</div>}
                {!loadingUsers && allUsers.length === 0 && (
                  <div className={styles.resultsHint}>No other users yet.</div>
                )}
                {!loadingUsers && allUsers.length > 0 && filtered.length === 0 && (
                  <div className={styles.resultsHint}>No matches.</div>
                )}
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.resultRow}
                    // onMouseDown fires before input blur, so the pick isn't lost.
                    onMouseDown={(e) => { e.preventDefault(); handlePick(p); }}
                  >
                    <span className={styles.resultUsername}>@{p.username}</span>
                    {p.displayName && (
                      <span className={styles.resultName}>{p.displayName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <label className={styles.label}>Note (optional)</label>
        <textarea
          className={styles.textarea}
          placeholder="thought of you when I saw this…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.primaryBtn}
          onClick={handleSend}
          disabled={!picked || sending}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
