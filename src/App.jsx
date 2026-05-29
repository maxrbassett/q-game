import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Header from "./components/Header";
import CategoryFilter from "./components/CategoryFilter";
import QuestionCard from "./components/QuestionCard";
import FavoritesDrawer from "./components/FavoritesDrawer";
import PWAModal from "./components/PWAModal";
import ListView from "./components/ListView";
import SignInModal from "./components/SignInModal";
import { useTheme } from "./hooks";
import "./styles/globals.css";

function AppContent() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { view, closeView } = useApp();

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        onFavoritesOpen={() => setShowFavorites(true)}
        onInstallOpen={() => setShowInstall(true)}
        onAccountOpen={() => setShowAccount(true)}
      />
      <CategoryFilter />
      <QuestionCard />

      {showFavorites && (
        <FavoritesDrawer onClose={() => setShowFavorites(false)} />
      )}
      {showInstall && (
        <PWAModal onClose={() => setShowInstall(false)} />
      )}
      {showAccount && (
        <SignInModal onClose={() => setShowAccount(false)} />
      )}
      {(view === "categories" || view === "tags") && (
        <ListView mode={view} onClose={closeView} />
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
