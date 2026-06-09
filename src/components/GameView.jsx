import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import { getChoices } from "../data/choices";
import {
  roleOf,
  isYourTurn,
  guessVerdict,
  submitBTurn,
  submitAGuess,
} from "../services/gameService";
import styles from "./GameView.module.css";

/**
 * Full-screen, step-by-step view of a single round.
 *
 * Branches on (role, status):
 *   - B during 'awaiting_b':  guess A's answer -> reveal -> answer it yourself
 *   - A during 'awaiting_a':  see B's guess of you -> guess B's answer -> reveal
 *   - not your turn:          a calm "waiting on @them" screen
 *   - 'complete':             the recap, readable by both
 *
 * Guesses lock the moment a reveal happens (we persist then), so nobody can
 * change a guess after seeing the answer.
 */
export default function GameView({ round, onClose, onSubmitted }) {
  const { user } = useApp();
  const role = roleOf(round, user?.id);
  const yourTurn = isYourTurn(round, user?.id);

  const flow =
    round.status === "complete" ? "recap" :
    !yourTurn ? "waiting" :
    role === "B" ? "bturn" : "aturn";

  const [step, setStep] = useState(
    flow === "bturn" ? "guess" : flow === "aturn" ? "seeGuess" : flow,
  );
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Local working state for whichever turn is in progress.
  const [guessChoice, setGuessChoice] = useState(null);
  const [guessText, setGuessText] = useState("");
  const [guessSkipped, setGuessSkipped] = useState(false);
  const [ansChoice, setAnsChoice] = useState(null);
  const [ansText, setAnsText] = useState("");

  useKeyPress("Escape", onClose);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const q = round.question;
  const choices = q ? getChoices(q) : null;
  const hasChoices = !!choices;

  // Opponent / possessive labels, personalized to the viewer.
  const aName = role === "A" ? "You" : `@${round.fromUsername ?? "them"}`;
  const bName = role === "B" ? "You" : `@${round.toUsername ?? "them"}`;
  const aPoss = role === "A" ? "Your" : `${aName}'s`;
  const bPoss = role === "B" ? "Your" : `${bName}'s`;
  const opponent = role === "B" ? `@${round.fromUsername ?? "them"}` : `@${round.toUsername ?? "them"}`;

  const localGuess = { text: guessText, choice: guessChoice, skipped: guessSkipped };
  const guessReady = guessSkipped || (hasChoices ? !!guessChoice : !!guessText.trim());
  const answerReady = hasChoices ? !!ansChoice : !!ansText.trim();

  // ── Turn submissions ────────────────────────────────────────────────────────
  const finishBTurn = async () => {
    setBusy(true); setError("");
    try {
      await submitBTurn(round.id, {
        guess: localGuess,
        answer: { text: ansText, choice: ansChoice },
      });
      onSubmitted?.();
      setDone(true);
    } catch (e) {
      setError(e?.message ?? "Couldn't send. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const finishAGuess = async () => {
    setBusy(true); setError("");
    try {
      await submitAGuess(round.id, { guess: localGuess });
      onSubmitted?.();
      setStep("reveal");
    } catch (e) {
      setError(e?.message ?? "Couldn't save your guess. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Shell ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <span className={styles.headerOpponent}>{opponent}</span>
          <span className={styles.headerCategory}>{q?.category}</span>
        </header>

        <div className={styles.body}>
          <p className={styles.question}>{choices?.displayText ?? q?.text ?? "(question unavailable)"}</p>

          {done ? (
            <DoneScreen opponent={opponent} />
          ) : flow === "recap" ? (
            <Recap
              round={round} hasChoices={hasChoices}
              aName={aName} bName={bName} aPoss={aPoss} bPoss={bPoss}
            />
          ) : flow === "waiting" ? (
            <Waiting role={role} round={round} opponent={opponent} />
          ) : flow === "bturn" ? (
            <BTurn
              step={step} setStep={setStep}
              round={round} choices={choices} hasChoices={hasChoices}
              aName={aName}
              guessChoice={guessChoice} setGuessChoice={setGuessChoice}
              guessText={guessText} setGuessText={setGuessText}
              setGuessSkipped={setGuessSkipped}
              localGuess={localGuess}
              ansChoice={ansChoice} setAnsChoice={setAnsChoice}
              ansText={ansText} setAnsText={setAnsText}
              guessReady={guessReady} answerReady={answerReady}
              busy={busy} onFinish={finishBTurn}
            />
          ) : (
            <ATurn
              step={step} setStep={setStep}
              round={round} choices={choices} hasChoices={hasChoices}
              bName={bName} bPoss={bPoss}
              guessChoice={guessChoice} setGuessChoice={setGuessChoice}
              guessText={guessText} setGuessText={setGuessText}
              setGuessSkipped={setGuessSkipped}
              localGuess={localGuess}
              guessReady={guessReady}
              busy={busy} onFinish={finishAGuess}
            />
          )}

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── B's turn ──────────────────────────────────────────────────────────────────

function BTurn({
  step, setStep, round, choices, hasChoices, aName,
  guessChoice, setGuessChoice, guessText, setGuessText, setGuessSkipped,
  localGuess, ansChoice, setAnsChoice, ansText, setAnsText,
  guessReady, answerReady, busy, onFinish,
}) {
  if (step === "guess") {
    return (
      <>
        <Banner kind="prompt">Guess what {aName} answered.</Banner>
        {round.note && <NoteBlock label={`${aName}'s note`} text={round.note} />}
        <GuessInput
          choices={choices} hasChoices={hasChoices}
          choice={guessChoice} setChoice={setGuessChoice}
          text={guessText} setText={setGuessText}
          placeholder={`What do you think ${aName} said?`}
        />
        <div className={styles.actions}>
          {!hasChoices && (
            <button
              className={styles.ghostBtn}
              onClick={() => { setGuessSkipped(true); setStep("reveal"); }}
            >
              Skip guess
            </button>
          )}
          <button
            className={styles.primaryBtn}
            disabled={!guessReady}
            onClick={() => setStep("reveal")}
          >
            Reveal {aName}'s answer
          </button>
        </div>
      </>
    );
  }

  if (step === "reveal") {
    const verdict = guessVerdict(localGuess, round.aAnswer);
    return (
      <>
        <VerdictBanner verdict={verdict} skipped={localGuess.skipped} subjectPoss="Your" />
        {!localGuess.skipped && (
          <AnswerCard label="You guessed" answer={localGuess} hasChoices={hasChoices} muted />
        )}
        <AnswerCard label={`${aName} actually said`} answer={round.aAnswer} hasChoices={hasChoices} highlight />
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => setStep("answer")}>
            Now answer it yourself
          </button>
        </div>
      </>
    );
  }

  // step === "answer"
  return (
    <>
      <Banner kind="prompt">Your turn — how do you answer?</Banner>
      <GuessInput
        choices={choices} hasChoices={hasChoices}
        choice={ansChoice} setChoice={setAnsChoice}
        text={ansText} setText={setAnsText}
        placeholder="Type your answer…"
      />
      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          disabled={!answerReady || busy}
          onClick={onFinish}
        >
          {busy ? "Sending…" : `Send back to ${aName}`}
        </button>
      </div>
    </>
  );
}

// ── A's turn ──────────────────────────────────────────────────────────────────

function ATurn({
  step, setStep, round, choices, hasChoices, bName, bPoss,
  guessChoice, setGuessChoice, guessText, setGuessText, setGuessSkipped,
  localGuess, guessReady, busy, onFinish,
}) {
  if (step === "seeGuess") {
    const bGuessedRight = guessVerdict(round.bGuess, round.aAnswer);
    return (
      <>
        <Banner kind="info">{bName} played your round!</Banner>
        <VerdictBanner
          verdict={bGuessedRight}
          skipped={round.bGuess.skipped}
          subjectName={bName}
          context="reading you"
        />
        {!round.bGuess.skipped && (
          <AnswerCard label={`${bName} guessed you'd say`} answer={round.bGuess} hasChoices={hasChoices} muted />
        )}
        <AnswerCard label="Your answer was" answer={round.aAnswer} hasChoices={hasChoices} />
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => setStep("guess")}>
            Now guess what {bName} said
          </button>
        </div>
      </>
    );
  }

  if (step === "guess") {
    return (
      <>
        <Banner kind="prompt">Guess what {bName} actually answered.</Banner>
        <GuessInput
          choices={choices} hasChoices={hasChoices}
          choice={guessChoice} setChoice={setGuessChoice}
          text={guessText} setText={setGuessText}
          placeholder={`What do you think ${bName} said?`}
        />
        <div className={styles.actions}>
          {!hasChoices && (
            <button
              className={styles.ghostBtn}
              disabled={busy}
              onClick={() => { setGuessSkipped(true); onFinish(); }}
            >
              Skip guess
            </button>
          )}
          <button
            className={styles.primaryBtn}
            disabled={!guessReady || busy}
            onClick={onFinish}
          >
            {busy ? "Saving…" : `Reveal ${bName}'s answer`}
          </button>
        </div>
      </>
    );
  }

  // step === "reveal"
  const verdict = guessVerdict(localGuess, round.bAnswer);
  return (
    <>
      <VerdictBanner verdict={verdict} skipped={localGuess.skipped} subjectPoss="Your" />
      {!localGuess.skipped && (
        <AnswerCard label="You guessed" answer={localGuess} hasChoices={hasChoices} muted />
      )}
      <AnswerCard label={`${bName} actually said`} answer={round.bAnswer} hasChoices={hasChoices} highlight />
      <Banner kind="done">Round complete — saved to your archive.</Banner>
    </>
  );
}

// ── Waiting (not your turn, not complete) ─────────────────────────────────────

function Waiting({ role, round, opponent }) {
  const msg = round.status === "awaiting_b"
    ? `Waiting for ${opponent} to guess your answer.`
    : `Waiting for ${opponent} to guess your answer back.`;
  return (
    <div className={styles.waiting}>
      <div className={styles.waitingIcon}>⏳</div>
      <p className={styles.waitingText}>{msg}</p>
      <p className={styles.waitingSub}>You'll be nudged when it's your move.</p>
    </div>
  );
}

// ── Recap (complete) ──────────────────────────────────────────────────────────

function Recap({ round, hasChoices, aName, bName, aPoss, bPoss }) {
  const bOnA = guessVerdict(round.bGuess, round.aAnswer); // did B read A right?
  const aOnB = guessVerdict(round.aGuess, round.bAnswer); // did A read B right?
  return (
    <>
      <Banner kind="done">Round complete</Banner>
      <AnswerCard label={`${aPoss} answer`} answer={round.aAnswer} hasChoices={hasChoices} highlight />
      <AnswerCard
        label={`${bName} guessed`}
        answer={round.bGuess}
        hasChoices={hasChoices}
        verdict={bOnA}
        muted
      />
      <div className={styles.recapDivider} />
      <AnswerCard label={`${bPoss} answer`} answer={round.bAnswer} hasChoices={hasChoices} highlight />
      <AnswerCard
        label={`${aName} guessed`}
        answer={round.aGuess}
        hasChoices={hasChoices}
        verdict={aOnB}
        muted
      />
    </>
  );
}

// ── Done confirmation (after submitting B's turn) ─────────────────────────────

function DoneScreen({ opponent }) {
  return (
    <div className={styles.waiting}>
      <div className={styles.doneIcon}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className={styles.waitingText}>Sent back to {opponent}.</p>
      <p className={styles.waitingSub}>They'll see how you did and guess your answer next.</p>
    </div>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function Banner({ kind, children }) {
  return <div className={`${styles.banner} ${styles[`banner_${kind}`]}`}>{children}</div>;
}

function VerdictBanner({ verdict, skipped, subjectName, subjectPoss, context }) {
  // verdict: true | false | null (null = free-text/skipped, no objective answer)
  const who = subjectPoss ?? (subjectName ? `${subjectName}'s` : "The");
  if (skipped) {
    return <div className={`${styles.banner} ${styles.banner_neutral}`}>{who} guess was skipped — here's the answer.</div>;
  }
  if (verdict === null) {
    return <div className={`${styles.banner} ${styles.banner_neutral}`}>No right answer here — compare and see.</div>;
  }
  if (verdict) {
    return (
      <div className={`${styles.banner} ${styles.banner_correct}`}>
        🎯 {subjectName ? `${subjectName} nailed it${context ? ` — good at ${context}!` : "!"}` : "Nailed it!"}
      </div>
    );
  }
  return (
    <div className={`${styles.banner} ${styles.banner_wrong}`}>
      ❌ {subjectName ? `${subjectName} missed this one.` : "Not quite."}
    </div>
  );
}

function NoteBlock({ label, text }) {
  return (
    <div className={styles.note}>
      <span className={styles.noteLabel}>{label}</span>
      <p className={styles.noteText}>{text}</p>
    </div>
  );
}

function AnswerCard({ label, answer, hasChoices, highlight, muted, verdict }) {
  const choice = answer?.choice ?? null;
  const text = answer?.text ?? "";
  const empty = !choice && !text.trim();
  return (
    <div className={`${styles.answerCard} ${highlight ? styles.answerHighlight : ""} ${muted ? styles.answerMuted : ""}`}>
      <div className={styles.answerLabelRow}>
        <span className={styles.answerLabel}>{label}</span>
        {verdict === true && <span className={styles.tagCorrect}>right ✓</span>}
        {verdict === false && <span className={styles.tagWrong}>wrong ✗</span>}
      </div>
      {empty ? (
        <p className={styles.answerEmpty}>{answer?.skipped ? "(skipped)" : "(no answer)"}</p>
      ) : (
        <>
          {choice && <div className={styles.answerChoice}>{choice}</div>}
          {text.trim() && (
            <p className={styles.answerText}>{hasChoices && choice ? `“${text.trim()}”` : text.trim()}</p>
          )}
        </>
      )}
    </div>
  );
}

function GuessInput({ choices, hasChoices, choice, setChoice, text, setText, placeholder }) {
  return (
    <div className={styles.input}>
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
                onClick={() => setChoice(active ? null : opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
      <textarea
        className={styles.textarea}
        placeholder={hasChoices ? "Add a note (optional)…" : placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
    </div>
  );
}
