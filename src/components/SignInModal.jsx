import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import { supabase } from "../services/supabase";
import styles from "./SignInModal.module.css";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function SignInModal({ onClose }) {
  const { user, isCloudEnabled, signInWithGoogle, signOut } = useApp();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [signInError, setSignInError] = useState("");

  useKeyPress("Escape", onClose);

  useEffect(() => {
    if (!user || !supabase) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn("[profile] fetch:", error.message);
        setProfile(data ?? null);
        setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const handleSignIn = async () => {
    setSignInError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setSignInError(err?.message ?? "Sign in failed");
    }
  };

  const handleClaimUsername = async (e) => {
    e.preventDefault();
    const name = usernameInput.trim().toLowerCase();
    if (!USERNAME_RE.test(name)) {
      setUsernameError("3–20 chars: lowercase letters, numbers, underscores.");
      return;
    }
    setSavingUsername(true);
    setUsernameError("");
    const { error } = await supabase
      .from("profiles")
      .update({ username: name })
      .eq("id", user.id);
    setSavingUsername(false);
    if (error) {
      // unique violation → friendlier message
      if (error.code === "23505") {
        setUsernameError("That username is taken. Try another.");
      } else {
        setUsernameError(error.message);
      }
      return;
    }
    setProfile((p) => ({ ...(p ?? {}), username: name }));
  };

  const renderBody = () => {
    if (!isCloudEnabled) {
      return (
        <div className={styles.notice}>
          <p>Sign-in isn't configured for this build.</p>
          <p className={styles.hint}>
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
            <code> .env.local</code> and restart the dev server.
          </p>
        </div>
      );
    }

    if (!user) {
      return (
        <div className={styles.signInBlock}>
          <p className={styles.lede}>
            Sign in to sync your favorites and answers across devices.
          </p>
          <button className={styles.googleBtn} onClick={handleSignIn}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.8.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.34A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
            Sign in with Google
          </button>
          {signInError && <p className={styles.error}>{signInError}</p>}
          <p className={styles.smallHint}>
            Your existing favorites and answers on this device will be migrated to your account.
          </p>
        </div>
      );
    }

    if (profileLoading) {
      return <div className={styles.notice}>Loading…</div>;
    }

    if (profile && !profile.username) {
      return (
        <form className={styles.usernameForm} onSubmit={handleClaimUsername}>
          <p className={styles.lede}>Pick a username</p>
          <p className={styles.hint}>
            This is how friends will find you when sending questions. Letters,
            numbers, and underscores. 3–20 characters.
          </p>
          <div className={styles.usernameRow}>
            <span className={styles.atSign}>@</span>
            <input
              className={styles.input}
              autoFocus
              placeholder="yourname"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
              maxLength={20}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {usernameError && <p className={styles.error}>{usernameError}</p>}
          <button className={styles.primaryBtn} type="submit" disabled={savingUsername}>
            {savingUsername ? "Saving…" : "Claim username"}
          </button>
        </form>
      );
    }

    return (
      <div className={styles.signedInBlock}>
        <p className={styles.lede}>
          Signed in as <span className={styles.username}>@{profile?.username}</span>
        </p>
        {profile?.display_name && (
          <p className={styles.subtle}>{profile.display_name}</p>
        )}
        <button
          className={styles.secondaryBtn}
          onClick={async () => { await signOut(); onClose(); }}
        >
          Sign out
        </button>
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-label="Sign in">
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>Account</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {renderBody()}
      </div>
    </div>
  );
}
