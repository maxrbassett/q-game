import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import { slugify } from "../data/tags";
import styles from "./TagPicker.module.css";

export default function TagPicker({ question, onClose }) {
  const {
    allTags,
    createTag,
    getTagsForQuestion,
    setTagsForQuestion,
  } = useApp();

  const initialSet = useMemo(
    () => new Set(getTagsForQuestion(question)),
    [question?.id]
  );

  const [selected, setSelected] = useState(initialSet);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  useKeyPress("Escape", onClose);

  const trimmedQuery = query.trim();
  const querySlug = slugify(trimmedQuery);

  const filteredTags = useMemo(() => {
    if (!trimmedQuery) return allTags;
    const q = trimmedQuery.toLowerCase();
    return allTags.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
    );
  }, [allTags, trimmedQuery]);

  const exactMatchExists = useMemo(
    () => allTags.some((t) => t.slug === querySlug),
    [allTags, querySlug]
  );

  const toggle = (slug) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleCreate = () => {
    if (!trimmedQuery || exactMatchExists) return;
    const slug = createTag(trimmedQuery);
    if (slug) {
      setSelected((prev) => new Set(prev).add(slug));
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSave = () => {
    setTagsForQuestion(question.id, Array.from(selected));
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && trimmedQuery && !exactMatchExists) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.panel} role="dialog" aria-label="Edit tags">
        <div className={styles.handle} />

        <div className={styles.header}>
          <h3 className={styles.title}>Tags</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          className={styles.search}
          type="text"
          placeholder="Search or create a tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
        />

        <ul className={styles.list}>
          {filteredTags.length === 0 && !trimmedQuery && (
            <li className={styles.empty}>No tags yet. Type to create one.</li>
          )}
          {filteredTags.map((t) => {
            const checked = selected.has(t.slug);
            return (
              <li key={t.slug}>
                <button
                  type="button"
                  className={`${styles.row} ${checked ? styles.rowChecked : ""}`}
                  onClick={() => toggle(t.slug)}
                  role="checkbox"
                  aria-checked={checked}
                >
                  <span className={`${styles.check} ${checked ? styles.checkOn : ""}`}>
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span className={styles.rowLabel}>{t.label}</span>
                  {t.isCustom && <span className={styles.customMark}>custom</span>}
                  <span className={styles.rowCount}>{t.count}</span>
                </button>
              </li>
            );
          })}

          {trimmedQuery && !exactMatchExists && (
            <li>
              <button
                type="button"
                className={`${styles.row} ${styles.createRow}`}
                onClick={handleCreate}
              >
                <span className={styles.check}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className={styles.rowLabel}>
                  Create "<strong>{trimmedQuery}</strong>"
                </span>
              </button>
            </li>
          )}
        </ul>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>Done</button>
        </div>
      </div>
    </div>
  );
}
