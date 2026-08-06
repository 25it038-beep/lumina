"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { setActiveUserId } from "@/lib/auth/storage";
import { useDeckStore } from "@/stores/deckStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { projectMemoryStore } from "@/lib/context/projectMemory";

/**
 * Binds all persisted stores to the signed-in user. Runs inside ClerkProvider
 * (layout level) so every page is scoped: decks, settings and project memory
 * are namespaced per account, and switching accounts reloads the right data.
 */
export function AuthScope() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    setActiveUserId(user?.id ?? null);
    if (!isLoaded) return;
    if (!user) {
      useDeckStore.getState().clear();
    }
    useDeckStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
    projectMemoryStore.reload();
  }, [user?.id, isLoaded]);

  return null;
}
