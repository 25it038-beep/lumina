type UserResource = any;
import { scopedKeyFor } from "./storage";

/**
 * Durable per-account tutorial flags.
 * "Seen" state is written to the Clerk user's publicMetadata (survives
 * clearing browser storage, syncs across devices) with localStorage as a
 * fast local cache. Auto-showing tutorials only appear for genuinely new
 * accounts — existing users are never shown them again.
 */

export const NEW_USER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const TUTORIAL_FLAGS = {
  firstLogin: "lumina-tutorial",
  element: "lumina_element_tutorial_seen",
} as const;

export function isNewAccount(user?: UserResource | null): boolean {
  if (!user?.createdAt) return false;
  return Date.now() - new Date(user.createdAt).getTime() < NEW_USER_WINDOW_MS;
}

export function isTutorialSeen(user: UserResource | null | undefined, flag: string): boolean {
  if (!user) return false;
  try {
    const local = localStorage.getItem(scopedKeyFor(flag, user?.id));
    if (local === "1" || local === "true" || local === "yes") return true;
  } catch {
    /* storage unavailable */
  }
  try {
    const meta = (user.publicMetadata ?? {}) as Record<string, unknown>;
    const map = meta.tutorialsSeen as Record<string, unknown> | undefined;
    if (map && (map[flag] === true || map[flag] === 1 || map[flag] === "1")) return true;
  } catch {
    /* metadata unavailable */
  }
  return false;
}

export function markTutorialSeen(user: UserResource | null | undefined, flag: string): void {
  if (!user) return;
  try {
    localStorage.setItem(scopedKeyFor(flag, user?.id), "1");
  } catch {
    /* storage unavailable */
  }
  try {
    const current = (user.publicMetadata ?? {}) as Record<string, unknown>;
    if (user?.update) {
      void user
        .update({
          publicMetadata: {
            ...current,
            tutorialsSeen: {
              ...((current.tutorialsSeen as Record<string, unknown>) ?? {}),
              [flag]: true,
            },
          },
        })
        .catch(() => {
          /* best-effort sync — local flag still prevents re-showing */
        });
    }
  } catch {
    /* ignore */
  }
}
