/**
 * Firestore persistence service.
 *
 * All shared team data lives in one Firestore document:
 *   workspace/crystalclawz
 *
 * Fields stored:
 *   drafts         – DraftListPost[]
 *   calendarPosts  – CalendarPost[]  (dates stored as ISO strings)
 *   reviewPosts    – ReviewPost[]
 *
 * For 2–3 users this is simple, fast, and well within Firestore limits.
 *
 * When Firebase is not configured (no env vars), all methods are no-ops
 * so the app works locally without any Firebase credentials.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import { CalendarPost, DraftListPost, ReviewPost } from '../types';

export interface WorkspaceData {
  drafts: DraftListPost[];
  calendarPosts: CalendarPost[];
  reviewPosts: ReviewPost[];
}

/** Convert Date objects to ISO strings before storing */
const serializeCalendarPost = (post: CalendarPost): object => ({
  ...post,
  date: post.date instanceof Date ? post.date.toISOString() : post.date,
});

/** Restore ISO strings back to Date objects after loading */
const deserializeCalendarPost = (data: any): CalendarPost => ({
  ...data,
  date: data.date ? new Date(data.date) : new Date(),
});

export const firestoreService = {
  /** Load all shared workspace data. Returns null if no data exists yet or Firebase is not configured. */
  async load(): Promise<WorkspaceData | null> {
    if (!isFirebaseConfigured) return null;

    const WORKSPACE_DOC = doc(db, 'workspace', 'crystalclawz');
    const snap = await getDoc(WORKSPACE_DOC);
    if (!snap.exists()) return null;

    const raw = snap.data() as any;
    return {
      drafts: (raw.drafts ?? []) as DraftListPost[],
      calendarPosts: (raw.calendarPosts ?? []).map(deserializeCalendarPost),
      reviewPosts: (raw.reviewPosts ?? []) as ReviewPost[],
    };
  },

  /** Save all shared workspace data in one write. No-op when Firebase is not configured. */
  async save(data: WorkspaceData): Promise<void> {
    if (!isFirebaseConfigured) return;

    const WORKSPACE_DOC = doc(db, 'workspace', 'crystalclawz');
    await setDoc(WORKSPACE_DOC, {
      drafts: data.drafts,
      calendarPosts: data.calendarPosts.map(serializeCalendarPost),
      reviewPosts: data.reviewPosts,
      lastSaved: new Date().toISOString(),
    });
  },
};
