import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import {
  listRounds,
  roleOf,
  isYourTurn,
  guessVerdict,
  deleteRound,
} from "../services/gameService";
import GameView from "./GameView";
import styles from "./GamesList.module.css";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function GamesList({ onClose }) {
  const { user, refreshGames } = useApp();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRound, setOpenRound] = useState(null);

  useKeyPress("Escape", () => { if (!openRound) onClose(); });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const r = await listRounds(user.id);
    setRounds(r);
    setLoading(false);
    refreshGames?.();
  }, [user, refreshGames]);

  useEffect(() => { load(); }, [load]);

  if (!user) return null;

  const uid = user.id;
  const yourTurn = rounds.filter((r) => isYourTurn(r, uid));
  const waiting = rounds.filter((r) => r.status !== "complete" && !isYourTurn(r, uid));
  const archive = rounds.filter((r) => r.status === "complete");

  const handleDelete = async (round) => {
    await deleteRound(round.id);
    setRounds((prev) => prev.filter((r) => r.id !== round.id));
    refreshGames?.();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>Games</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </header>

        <div className={styles.scroll}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : rounds.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🎲</span>
              <p>No games yet.</p>
              <p className={styles.emptySub}>
                Answer a question, tap send, and challenge a friend to guess your answer.
              </p>
            </div>
          ) : (
            <>
              <Section title="Your turn" count={yourTurn.length} rounds={yourTurn} uid={uid} onOpen={setOpenRound} />
              <Section title="Waiting" count={waiting.length} rounds={waiting} uid={uid} onOpen={setOpenRound} />
              <Section title="Archive" count={archive.length} rounds={archive} uid={uid} onOpen={setOpenRound} onDelete={handleDelete} />
            </>
          )}
        </div>
      </div>

      {openRound && (
        <GameView
          round={openRound}
          onClose={() => setOpenRound(null)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}

function Section({ title, count, rounds, uid, onOpen, onDelete }) {
  if (count === 0) return null;
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        {title} <span className={styles.sectionCount}>{count}</span>
      </h3>
      <ul className={styles.list}>
        {rounds.map((r) => (
          <RoundRow key={r.id} round={r} uid={uid} onOpen={onOpen} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  );
}

function RoundRow({ round, uid, onOpen, onDelete }) {
  const role = roleOf(round, uid);
  const opponent = role === "B" ? round.fromUsername : round.toUsername;
  const yours = isYourTurn(round, uid);

  let pill, pillKind;
  if (round.status === "complete") {
    pill = "Done"; pillKind = "done";
  } else if (yours) {
    pill = "Your turn"; pillKind = "turn";
  } else {
    pill = `Waiting on @${opponent ?? "them"}`; pillKind = "waiting";
  }

  // Archive sub-line: how each side did.
  let score = null;
  if (round.status === "complete") {
    const bOnA = guessVerdict(round.bGuess, round.aAnswer);
    const aOnB = guessVerdict(round.aGuess, round.bAnswer);
    const youCorrect = role === "A" ? aOnB : bOnA;
    const themCorrect = role === "A" ? bOnA : aOnB;
    const mark = (v) => (v === null ? "—" : v ? "✓" : "✗");
    score = `You ${mark(youCorrect)} · @${opponent ?? "them"} ${mark(themCorrect)}`;
  }

  return (
    <li className={styles.row}>
      <button className={styles.rowBtn} onClick={() => onOpen(round)}>
        <div className={styles.rowTop}>
          <span className={styles.rowUser}>
            {role === "B" ? "from " : "to "}<span className={styles.rowUsername}>@{opponent ?? "unknown"}</span>
          </span>
          <span className={`${styles.pill} ${styles[`pill_${pillKind}`]}`}>{pill}</span>
        </div>
        <p className={styles.rowQuestion}>{round.question?.text ?? "(question unavailable)"}</p>
        <div className={styles.rowMeta}>
          {score ? <span className={styles.rowScore}>{score}</span> : <span>{round.question?.category}</span>}
          <span>·</span>
          <span>{timeAgo(round.completedAt ?? round.bPlayedAt ?? round.sentAt)}</span>
        </div>
      </button>
      {onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(round)}
          aria-label="Delete round"
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </li>
  );
}
