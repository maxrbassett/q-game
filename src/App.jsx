import React, { useEffect, useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import CategoryFilter from "./components/CategoryFilter";
import QuestionCard from "./components/QuestionCard";
import FavoritesDrawer from "./components/FavoritesDrawer";
import PWAModal from "./components/PWAModal";
import ListView from "./components/ListView";
import SignInModal from "./components/SignInModal";
import InboxDrawer from "./components/InboxDrawer";
import InboxToast from "./components/InboxToast";
import WelcomeScreen from "./components/WelcomeScreen";
import { useTheme } from "./hooks";
import "./styles/globals.css";

function readWelcomeDismissed() {
  try { return localStorage.getItem("qgame_welcome_dismissed") === "1"; }
  catch { return false; }
}

function AppContent() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(readWelcomeDismissed);
  const [theme, toggleTheme] = useTheme();
  const {
    view,
    closeView,
    user,
    profile,
    authReady,
    isCloudEnabled,
  } = useApp();

  // When a guest signs in mid-session, mark welcome as dismissed so the
  // next sign-out doesn't bounce them back into Welcome before profile loads.
  useEffect(() => {
    if (user) {
      try { localStorage.setItem("qgame_welcome_dismissed", "1"); } catch {}
      setWelcomeDismissed(true);
    }
  }, [user]);

  // Welcome gate: show until the user picks an option (sign in or guest).
  // Cloud has to be configured (otherwise nothing to sign into) and auth
  // bootstrap has to finish (so we don't flash the gate for returning users).
  const showWelcome = isCloudEnabled && authReady && !user && !welcomeDismissed;

  // Username gate: signed-in user without a username gets the modal forced
  // open until they pick one.
  const needsUsername = !!user && profile && !profile.username;

  if (showWelcome) {
    return (
      <WelcomeScreen onContinueAsGuest={() => setWelcomeDismissed(true)} />
    );
  }

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        onFavoritesOpen={() => setShowFavorites(true)}
        onInstallOpen={() => setShowInstall(true)}
        onAccountOpen={() => setShowAccount(true)}
        onInboxOpen={() => setShowInbox(true)}
      />
      <CategoryFilter />
      <QuestionCard />

      <InboxToast onOpenInbox={() => setShowInbox(true)} />

      {showFavorites && (
        <FavoritesDrawer onClose={() => setShowFavorites(false)} />
      )}
      {showInstall && (
        <PWAModal onClose={() => setShowInstall(false)} />
      )}
      {showAccount && (
        <SignInModal onClose={() => setShowAccount(false)} />
      )}
      {showInbox && (
        <InboxDrawer onClose={() => setShowInbox(false)} />
      )}
      {(view === "categories" || view === "tags") && (
        <ListView mode={view} onClose={closeView} />
      )}

      {/* Forced username claim — non-dismissible until they pick a handle. */}
      {needsUsername && (
        <SignInModal enforceUsername onClose={() => {/* enforced */}} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
