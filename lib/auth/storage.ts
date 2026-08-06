import type { StateStorage } from "zustand/middleware";

/**
 * User-scoped browser storage.
 * All persisted data (decks, settings, tutorials) is namespaced per Clerk
 * user id so each account only sees its own data on a shared machine.
 */

let activeUserId: string | null = null;

export const setActiveUserId = (id: string | null) => {
  activeUserId = id;
};

export const getActiveUserId = () => activeUserId;

export const scopedKeyFor = (base: string, userId?: string | null) => {
  const id = userId ?? activeUserId;
  return id ? `${base}::${id}` : base;
};

/**
 * Zustand persist storage that forwards every read/write to the
 * user-scoped key (the persist `name` is used as the base key).
 */
export function userScopedStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(scopedKeyFor(name));
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(scopedKeyFor(name), value);
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(scopedKeyFor(name));
    },
  };
}
