# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

There is no test runner, linter, or type checker configured. Plain JavaScript + JSX, no TypeScript.

## Architecture

React 18 + Vite PWA. Mobile-first, single page with modal/drawer overlays instead of a router. CSS Modules per component plus design tokens in `src/styles/globals.css` (theme via `document.documentElement.dataset.theme`).

### State: one context, one storage seam

All global state lives in [src/context/AppContext.jsx](src/context/AppContext.jsx) (`AppProvider` / `useApp`). It owns the active filter, the current deck, favorites, answers, custom tags, per-question tag overrides, and the current view mode (`"cards" | "categories" | "tags"`). Components read state via `useApp()`; they should not call the storage layer directly.

All persistence is funneled through [src/services/storageService.js](src/services/storageService.js) — the **only** file that touches `localStorage`. Keys are namespaced `qgame_*`. This file is the designated swap point for Firebase: replacing the function bodies should require zero changes elsewhere. AppContext mirrors storage into React state by re-reading after each mutation (`toggleFav(); setFavorites(getFavorites())`), so storage stays authoritative.

### Questions and the deck

Questions are static data in [src/data/questions.js](src/data/questions.js) (~2600 lines, one `QUESTIONS` array). `CATEGORIES` is exported from the same file — adding a category means adding a key and using it on questions; the filter UI picks it up automatically. `getQuestions({ category, tag, tagOverrides })` returns a Fisher-Yates–shuffled copy filtered by **either** category **or** tag (mutually exclusive — never both). The deck reshuffles automatically when exhausted ([AppContext.jsx:82-89](src/context/AppContext.jsx#L82-L89)).

### Tags: three layers

Tag resolution in [src/data/tags.js](src/data/tags.js) merges three sources:

1. **Built-in slugs** — `question.tags` arrays in `questions.js`, with friendly labels in `BUILT_IN_TAG_LABELS`.
2. **User custom tags** — slug → `{ label, createdAt }` map in localStorage (`qgame_custom_tags`).
3. **Per-question overrides** — `{ [questionId]: string[] }` in localStorage (`qgame_question_tags`). When present, the override **fully replaces** the data's tag list for that question (including `[]` meaning "user removed all tags").

Always read effective tags via `effectiveTagsFor(question, overrides)`, never `question.tags` directly. Display labels via `tagLabel(slug, customTags)` to pick up custom names, built-in labels, or fall back to `humanizeTag(slug)`.

### Choices parser

[src/data/choices.js](src/data/choices.js) (`getChoices(question)`) parses tap-to-select buttons out of question text — it's a pure function with no state. It recognizes three patterns:

- **scale** — `"...(1 = LOW, 3 = HIGH)"` (only for `RATE_BELIEVE` / `RATE_LIKE`)
- **multi** — `"STEM? A, B, C, or D."` or `"STEM... A, B, C, or D?"`
- **binary** — `"Would you rather X or Y?"` / `"Which is worse: X or Y?"` (uses the **last** ` or ` as the separator)

Returns `null` for free-response questions. When editing question text, keep these patterns intact or the UI will silently fall back to text-only answers.

### Hooks

[src/hooks/index.js](src/hooks/index.js) exports `useSwipe`, `useKeyPress` (ignores keys while typing in textarea/input), `useIsMobile`, `useLocalState`, and `useTheme` (persisted dark/light, defaults to system preference).

## Conventions worth knowing

- **No prop-drilling for global state** — reach for `useApp()` instead of threading props.
- **Mutations re-read from storage** — pattern is `mutate(); setState(getFromStorage())`. Don't optimistically update React state without persisting first.
- **Filter is exclusive** — setting a category clears the active tag and vice versa (see `selectCategory` / `selectTag`).
- **Custom tag deletion cascades** — `deleteCustomTag` also strips the tag from every per-question override and clears the active filter if it was selected.