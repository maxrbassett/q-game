import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import CategoryFilter from "./components/CategoryFilter";
import QuestionCard from "./components/QuestionCard";
import FavoritesDrawer from "./components/FavoritesDrawer";
import StatsPanel from "./components/StatsPanel";
import "./styles/globals.css";

function AppContent() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="app-shell">
      <Header
        onFavoritesOpen={() => setShowFavorites(true)}
        onStatsOpen={() => setShowStats(true)}
      />
      <CategoryFilter />
      <QuestionCard />

      {showFavorites && (
        <FavoritesDrawer onClose={() => setShowFavorites(false)} />
      )}
      {showStats && (
        <StatsPanel onClose={() => setShowStats(false)} />
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
