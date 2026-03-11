import { create } from "zustand";
import type { TodayHabitItem } from "@/lib/types/viewModels";
import type { Subscription } from "@/lib/types/models";
import * as storage from "@/lib/storage";

export type LoadStatus = "idle" | "loading" | "success" | "error";

const SUBSCRIPTION_KEY = "app_subscription";
const ONBOARDING_SELECTED_KEY = "app_onboarding_selected";

const DEFAULT_SUBSCRIPTION: Subscription = { tier: "free", expiresAt: null };

type AppState = {
  // Today list
  todayItems: TodayHabitItem[];
  todayStatus: LoadStatus;
  todayError: string | null;

  // Stats
  statsStatus: LoadStatus;
  statsError: string | null;

  // Subscription cache
  subscription: Subscription;

  // Onboarding
  onboardingSelectedIds: string[];

  // Actions
  bootstrap: () => Promise<void>;
  loadToday: (date: string) => Promise<void>;
  toggleToday: (habitId: string, date: string) => Promise<void>;
  refreshAll: (date: string) => Promise<void>;
  setOnboardingSelected: (ids: string[]) => Promise<void>;
  setSubscription: (sub: Subscription) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  todayItems: [],
  todayStatus: "idle",
  todayError: null,

  statsStatus: "idle",
  statsError: null,

  subscription: DEFAULT_SUBSCRIPTION,

  onboardingSelectedIds: [],

  bootstrap: async (): Promise<void> => {
    try {
      const [subRaw, selectedRaw] = await Promise.all([
        storage.getItem(SUBSCRIPTION_KEY),
        storage.getItem(ONBOARDING_SELECTED_KEY),
      ]);

      const subscription: Subscription = subRaw
        ? (JSON.parse(subRaw) as Subscription)
        : DEFAULT_SUBSCRIPTION;

      const onboardingSelectedIds: string[] = selectedRaw
        ? (JSON.parse(selectedRaw) as string[])
        : [];

      set({ subscription, onboardingSelectedIds });
    } catch (err) {
      const message = err instanceof Error ? err.message : "bootstrap failed";
      set({ subscription: DEFAULT_SUBSCRIPTION, onboardingSelectedIds: [], todayError: message });
    }
  },

  loadToday: async (date: string): Promise<void> => {
    set({ todayStatus: "loading", todayError: null });
    try {
      // Repo integration point: replace stub with actual repo call when available.
      // e.g. const items = await todayRepo.listForDate(date);
      const items: TodayHabitItem[] = [];
      void date; // suppress unused-variable lint until repo is wired
      set({ todayItems: items, todayStatus: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "loadToday failed";
      set({ todayStatus: "error", todayError: message });
    }
  },

  toggleToday: async (habitId: string, date: string): Promise<void> => {
    const { todayItems } = get();

    // Optimistic update
    const updated = todayItems.map((item) =>
      item.habitId === habitId ? { ...item, isChecked: !item.isChecked } : item,
    );
    set({ todayItems: updated });

    try {
      // Repo integration point: persist toggle when check-in repo is available.
      // e.g. await checkInRepo.toggle(habitId, date);
      void date; // suppress unused-variable lint until repo is wired
    } catch (err) {
      // Revert optimistic update on failure
      set({ todayItems, todayError: err instanceof Error ? err.message : "toggleToday failed" });
    }
  },

  refreshAll: async (date: string): Promise<void> => {
    const { loadToday } = get();
    set({ statsStatus: "loading", statsError: null });

    try {
      await loadToday(date);
      // Stats repo integration point: replace stub when stats repo is available.
      // e.g. const stats = await statsRepo.getWeekly(date);
      set({ statsStatus: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "refreshAll failed";
      set({ statsStatus: "error", statsError: message });
    }
  },

  setOnboardingSelected: async (ids: string[]): Promise<void> => {
    try {
      await storage.setItem(ONBOARDING_SELECTED_KEY, JSON.stringify(ids));
      set({ onboardingSelectedIds: ids });
    } catch (err) {
      const message = err instanceof Error ? err.message : "setOnboardingSelected failed";
      set({ todayError: message });
    }
  },

  setSubscription: async (sub: Subscription): Promise<void> => {
    try {
      await storage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
      set({ subscription: sub });
    } catch (err) {
      const message = err instanceof Error ? err.message : "setSubscription failed";
      set({ todayError: message });
    }
  },
}));
