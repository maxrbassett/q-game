import React from "react";

/**
 * Q Game brand mark — a custom geometric monogram.
 *
 * Single-stroke construction: a perfect-circle bowl and a clean diagonal tail
 * that breaks out of the lower-right of the bowl. No serif contrast. Tail caps
 * are rounded to read as deliberate, not amputated.
 *
 * Uses `currentColor` so it inherits whatever color you set on the parent
 * (the header uses var(--accent); the PWA tile is rendered solid yellow over
 * the page background).
 *
 * @param {Object} props
 * @param {number} [props.size=40]      Pixel size of the square viewport.
 * @param {number} [props.strokeWidth=11]  Tuned for the 100×100 viewBox.
 * @param {string} [props.title]        Optional aria-label.
 */
export default function LogoMark({ size = 40, strokeWidth = 11, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      role={title ? "img" : "presentation"}
      aria-label={title}
    >
      <circle cx="40" cy="40" r="30" />
      <line x1="50" y1="50" x2="82" y2="82" />
    </svg>
  );
}
