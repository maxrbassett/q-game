import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import CategoryFilter from "./components/CategoryFilter";
import QuestionCard from "./components/QuestionCard";
import FavoritesDrawer from "./components/FavoritesDrawer";
import PWAModal from "./components/PWAModal";
import "./styles/globals.css";

function AppContent() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  return (
    <div className="app-shell">
      <Header
        onFavoritesOpen={() => setShowFavorites(true)}
        onInstallOpen={() => setShowInstall(true)}
      />
      <CategoryFilter />
      <QuestionCard />

      {showFavorites && (
        <FavoritesDrawer onClose={() => setShowFavorites(false)} />
      )}
      {showInstall && (
        <PWAModal onClose={() => setShowInstall(false)} />
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
