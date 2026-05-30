import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import LogoMark from "./LogoMark";
import styles from "./WelcomeScreen.module.css";

/**
 * Full-screen first-launch gate. Shown once when:
 *   - the cloud is configured AND
 *   - the user isn't signed in AND
 *   - they haven't previously picked "Continue as guest" on this device.
 *
 * Clearing the dismissal flag on sign-out (see AppContext.signOut) re-arms
 * this screen for the next visit.
 */
export default function WelcomeScreen({ onContinueAsGuest }) {
  const { signInWithGoogle, isCloudEnabled } = useApp();
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSignInError("");
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // Browser navigates away to Google's OAuth flow; nothing else to do.
    } catch (err) {
      setSignInError(err?.message ?? "Sign in failed");
      setSigningIn(false);
    }
  };

  const handleGuest = () => {
    try { localStorage.setItem("qgame_welcome_dismissed", "1"); } catch {}
    onContinueAsGuest?.();
  };

  return (
    <div className={styles.screen} role="dialog" aria-label="Welcome">
      <div className={styles.content}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <LogoMark size={80} strokeWidth={11} title="Q Game" />
          </span>
          <span className={styles.brandGame}>Game</span>
        </div>

        <p className={styles.tagline}>Questions that start real conversations.</p>

        <div className={styles.actions}>
          {isCloudEnabled ? (
            <>
              <button
                className={styles.googleBtn}
                onClick={handleSignIn}
                disabled={signingIn}
              >
                <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.8.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.34A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                {signingIn ? "Redirecting…" : "Sign in with Google"}
              </button>
              {signInError && <p className={styles.error}>{signInError}</p>}

              <p className={styles.signInWhy}>
                Sign in to send questions to friends and sync your favorites across devices.
              </p>

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <button className={styles.guestBtn} onClick={handleGuest}>
                Continue as guest
              </button>
              <p className={styles.guestHint}>
                Your favorites and answers stay on this device.
              </p>
            </>
          ) : (
            <>
              <p className={styles.unconfigured}>
                Sign-in isn't configured for this build. You can still play in guest mode.
              </p>
              <button className={styles.guestBtn} onClick={handleGuest}>
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
