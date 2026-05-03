# The Q Game

A mobile-first Progressive Web App for questions that start real conversations.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Project Structure

```
src/
├── data/
│   └── questions.js        ← ALL questions live here. Easy to add your own.
├── services/
│   └── storageService.js   ← All localStorage access. Swap for Firebase here.
├── context/
│   └── AppContext.jsx      ← Global state (favorites, answers, deck, category)
├── hooks/
│   └── index.js            ← useSwipe, useKeyPress, useIsMobile, useLocalState
├── components/
│   ├── Header.jsx           ← Logo + favorites/stats icon buttons
│   ├── CategoryFilter.jsx   ← Horizontal scrollable category pills
│   ├── QuestionCard.jsx     ← Main card with swipe, favorite, answer toggle
│   ├── AnswerPanel.jsx      ← Slide-up sheet for writing your answer
│   ├── FavoritesDrawer.jsx  ← Slide-up sheet for saved questions
│   └── StatsPanel.jsx       ← Progress stats by category
├── styles/
│   └── globals.css          ← Design tokens (CSS vars), resets, animations
├── App.jsx                  ← Root layout, modal state
└── main.jsx                 ← ReactDOM entry
```

## Adding Your Questions (Excel Import)

1. Export your Excel sheet as CSV
2. Open `src/data/questions.js`
3. Add entries to the `QUESTIONS` array:

```js
{
  id: "wyr-011",              // must be unique
  category: CATEGORIES.WOULD_YOU_RATHER,
  text: "Would you rather...",
}
```

4. That's it. Categories and filters update automatically.

You can also add entirely new categories by adding a key to the `CATEGORIES` object and using it in your questions.

## PWA Install

On mobile: open in Safari/Chrome → Share → "Add to Home Screen"  
On desktop Chrome: click the install icon in the address bar

## Firebase Migration Path (v2)

When you're ready to add auth + cloud sync:

1. `npm install firebase`
2. Create `src/services/firebase.js` with your Firebase config
3. In `src/services/storageService.js`, replace localStorage calls with Firestore:
   - `getFavorites()` → `getDocs(query(collection(db, "favorites"), where("userId", "==", uid)))`
   - `saveAnswer()` → `setDoc(doc(db, "answers", questionId), { userId: uid, text, timestamp })`
4. In `src/context/AppContext.jsx`, add a `user` state from `onAuthStateChanged`
5. Wrap protected routes with an auth check

No other files need to change.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| → | Next question |
| ← | Previous question |

Swipe left/right on the card on mobile.
