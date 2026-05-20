import React, { useEffect, useRef } from "react";
import { CATEGORIES } from "../data/questions";
import { useApp } from "../context/AppContext";
import styles from "./CategoryFilter.module.css";

const CATEGORY_ICONS = {
  [CATEGORIES.WOULD_YOU_RATHER]: "⚖️",
  [CATEGORIES.WHICH_IS_WORSE]:   "😬",
  [CATEGORIES.HOW_MUCH]:         "💸",
  [CATEGORIES.RATE_BELIEVE]:     "🤔",
  [CATEGORIES.RATE_LIKE]:        "❤️",
  [CATEGORIES.HAVE_YOU_EVER]:    "✋",
  [CATEGORIES.TELL_A_TIME]:      "💬",
};

export default function CategoryFilter() {
  const {
    activeCategory,
    activeTag,
    selectCategory,
    selectTag,
    clearFilter,
    allTags,
  } = useApp();

  const scrollRef = useRef(null);
  const activePillRef = useRef(null);

  // When the active filter changes, scroll it into view so the user can see
  // what's currently selected.
  useEffect(() => {
    if (activePillRef.current && scrollRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory, activeTag]);

  const noneActive = !activeCategory && !activeTag;
  const tagsToShow = allTags.filter((t) => t.count > 0 || t.isCustom);

  return (
    <nav className={styles.nav} aria-label="Question filters">
      <div className={styles.scroll} ref={scrollRef}>
        {/* "All" pill */}
        <button
          ref={noneActive ? activePillRef : null}
          className={`${styles.pill} ${noneActive ? styles.active : ""}`}
          onClick={clearFilter}
        >
          All
        </button>

        {Object.values(CATEGORIES).map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              ref={active ? activePillRef : null}
              className={`${styles.pill} ${active ? styles.active : ""}`}
              onClick={() => selectCategory(cat)}
            >
              <span className={styles.icon} aria-hidden="true">
                {CATEGORY_ICONS[cat]}
              </span>
              {cat}
            </button>
          );
        })}

        {tagsToShow.length > 0 && (
          <>
            <span className={styles.divider} aria-hidden="true" />
            {tagsToShow.map((t) => {
              const active = activeTag === t.slug;
              return (
                <button
                  key={t.slug}
                  ref={active ? activePillRef : null}
                  className={`${styles.pill} ${styles.pillTag} ${active ? styles.active : ""}`}
                  onClick={() => selectTag(t.slug)}
                  title={t.isCustom ? "Custom tag" : undefined}
                >
                  <span className={styles.tagDot} aria-hidden="true">#</span>
                  {t.label}
                </button>
              );
            })}
          </>
        )}
      </div>
    </nav>
  );
}
