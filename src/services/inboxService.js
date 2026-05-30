/**
 * Q Game - Inbox (sent_questions) service.
 *
 * All Phase 2 multi-user calls live here. Returns row shapes that the UI can
 * render directly — each row hydrates the question (id, category, text, tags)
 * and the other party's username via a join.
 */

import { supabase } from "./supabase";

function ready() {
  if (!supabase) throw new Error("Supabase client not configured");
}

// Select shape shared by inbox/outbox queries — joins question + both parties' usernames.
const SELECT =
  "id, from_user_id, to_user_id, question_id, note, sent_at, read_at, answered_at, answer_text, answer_choice, " +
  "question:questions ( id, category, text, tags ), " +
  "sender:profiles!sent_questions_from_user_id_fkey ( username, display_name ), " +
  "recipient:profiles!sent_questions_to_user_id_fkey ( username, display_name )";

function normalize(row) {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    questionId: row.question_id,
    note: row.note ?? null,
    sentAt: row.sent_at,
    readAt: row.read_at,
    answeredAt: row.answered_at,
    answerText: row.answer_text ?? "",
    answerChoice: row.answer_choice ?? null,
    question: row.question ?? null,
    senderUsername: row.sender?.username ?? null,
    senderDisplayName: row.sender?.display_name ?? null,
    recipientUsername: row.recipient?.username ?? null,
    recipientDisplayName: row.recipient?.display_name ?? null,
  };
}

// ── Send ─────────────────────────────────────────────────────────────────────

/**
 * @param {string} fromUserId
 * @param {string} toUserId
 * @param {string} questionId
 * @param {string|null} note
 */
export async function sendQuestion(fromUserId, toUserId, questionId, note = null) {
  ready();
  if (fromUserId === toUserId) throw new Error("You can't send a question to yourself.");
  const trimmed = (note ?? "").trim();
  const { data, error } = await supabase
    .from("sent_questions")
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      question_id: questionId,
      note: trimmed || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ── Username search (autocomplete) ───────────────────────────────────────────

/**
 * Prefix-match usernames. Caller passes the current user id so the autocomplete
 * never offers them themselves.
 */
export async function searchUsernames(query, selfId) {
  ready();
  const q = String(query ?? "").trim().toLowerCase();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", `${q}%`)
    .not("id", "eq", selfId)
    .limit(5);
  if (error) {
    console.warn("[inbox] searchUsernames:", error.message);
    return [];
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name ?? null,
  }));
}

// ── Lists ────────────────────────────────────────────────────────────────────

export async function listReceived(userId) {
  ready();
  const { data, error } = await supabase
    .from("sent_questions")
    .select(SELECT)
    .eq("to_user_id", userId)
    .order("sent_at", { ascending: false });
  if (error) {
    console.warn("[inbox] listReceived:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

export async function listSent(userId) {
  ready();
  const { data, error } = await supabase
    .from("sent_questions")
    .select(SELECT)
    .eq("from_user_id", userId)
    .order("sent_at", { ascending: false });
  if (error) {
    console.warn("[inbox] listSent:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

// ── Counts ───────────────────────────────────────────────────────────────────

/**
 * Unread + unanswered received questions. Used to size the header badge.
 */
export async function getUnreadCount(userId) {
  ready();
  const { count, error } = await supabase
    .from("sent_questions")
    .select("id", { count: "exact", head: true })
    .eq("to_user_id", userId)
    .is("read_at", null);
  if (error) {
    console.warn("[inbox] getUnreadCount:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Replies to questions YOU sent that landed after `sinceIso`. Used for the
 * toast on app open. Returns up to `limit` of the most recent ones with the
 * recipient's username for the message text.
 */
export async function listNewReplies(userId, sinceIso, limit = 5) {
  ready();
  const { data, error } = await supabase
    .from("sent_questions")
    .select(
      "id, answered_at, recipient:profiles!sent_questions_to_user_id_fkey ( username )",
    )
    .eq("from_user_id", userId)
    .not("answered_at", "is", null)
    .gt("answered_at", sinceIso)
    .order("answered_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[inbox] listNewReplies:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    answeredAt: r.answered_at,
    recipientUsername: r.recipient?.username ?? null,
  }));
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Mark every unread received row as read. Called when the drawer opens. */
export async function markInboxRead(userId) {
  ready();
  const { error } = await supabase
    .from("sent_questions")
    .update({ read_at: new Date().toISOString() })
    .eq("to_user_id", userId)
    .is("read_at", null);
  if (error) console.warn("[inbox] markInboxRead:", error.message);
}

export async function answerSentQuestion(rowId, { text = "", choice = null } = {}) {
  ready();
  const cleanText = (text ?? "").trim();
  const { error } = await supabase
    .from("sent_questions")
    .update({
      answer_text: cleanText,
      answer_choice: choice,
      answered_at: new Date().toISOString(),
    })
    .eq("id", rowId);
  if (error) throw error;
}

export async function deleteSentQuestion(rowId) {
  ready();
  const { error } = await supabase
    .from("sent_questions")
    .delete()
    .eq("id", rowId);
  if (error) throw error;
}

// ── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to inserts/updates that affect this user's inbox (either side).
 * Returns an `unsubscribe()` thunk. `onChange` is called on every event;
 * the caller decides how to refresh (usually: re-fetch lists + counts).
 */
export function subscribeToInbox(userId, onChange) {
  if (!supabase || !userId) return () => {};
  const channel = supabase
    .channel(`inbox:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sent_questions", filter: `to_user_id=eq.${userId}` },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sent_questions", filter: `from_user_id=eq.${userId}` },
      onChange,
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
