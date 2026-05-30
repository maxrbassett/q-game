/**
 * Regenerates supabase/seed.sql from src/data/questions.js.
 *
 * Run from the project root:
 *   node scripts/generate-seed-sql.mjs
 *
 * The generated file is one big INSERT ... ON CONFLICT DO NOTHING so re-running
 * it in the Supabase SQL editor is safe (idempotent for the seeded set).
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { QUESTIONS } from "../src/data/questions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../supabase/seed.sql");

function sqlString(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function sqlTextArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const inner = arr.map((t) => '"' + String(t).replace(/"/g, '\\"') + '"').join(",");
  return "'{" + inner + "}'";
}

const header = `-- =============================================================================
-- Q Game - Seed data (auto-generated from src/data/questions.js)
-- =============================================================================
-- Paste this whole file into the Supabase SQL editor after running schema.sql.
-- Safe to re-run: ON CONFLICT (id) DO NOTHING means existing rows are kept.
--
-- Regenerate with: node scripts/generate-seed-sql.mjs
-- =============================================================================

begin;

insert into public.questions (id, category, text, tags, created_by) values
`;

const rows = QUESTIONS.map((q) => {
  const id = sqlString(q.id);
  const category = sqlString(q.category);
  const text = sqlString(q.text);
  const tags = sqlTextArray(q.tags);
  return `  (${id}, ${category}, ${text}, ${tags}, null)`;
});

const footer = `
on conflict (id) do nothing;

commit;
`;

const sql = header + rows.join(",\n") + footer;

writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${QUESTIONS.length} questions to ${outPath}`);
