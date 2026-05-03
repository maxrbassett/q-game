import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import styles from "./AnswerPanel.module.css";

export default function AnswerPanel({ question, onClose }) {
  const { getAnswer, saveAnswer, deleteAnswer } = useApp();
  const existing = getAnswer(question.id);
  const [text, setText] = useState(existing?.text ?? "");
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-focus textarea
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleSave = () => {
    if (text.trim()) {
      saveAnswer(question.id, text.trim());
    } else {
      deleteAnswer(question.id);
    }
    onClose();
  };

  const handleDelete = () => {
    deleteAnswer(question.id);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h3 className={styles.title}>Your Answer</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className={styles.questionPreview}>{question.text}</p>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Type your answer here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />

        <div className={styles.actions}>
          {existing && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          )}
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!text.trim() && !existing}
          >
            {existing ? "Update" : "Save"} Answer
          </button>
        </div>
      </div>
    </div>
  );
}
