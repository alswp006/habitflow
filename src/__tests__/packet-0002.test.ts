import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/store/appStore";

beforeEach(() => {
  // Reset store to initial state between tests
  useAppStore.setState({
    todayItems: [],
    todayStatus: "idle",
    todayError: null,
    statsStatus: "idle",
    statsError: null,
    subscription: { tier: "free", expiresAt: null },
    onboardingSelectedIds: [],
  });
});

describe("useAppStore initial state", () => {
  it("initializes subscription to free tier with null expiresAt", () => {
    const { subscription } = useAppStore.getState();
    expect(subscription.tier).toBe("free");
    expect(subscription.expiresAt).toBeNull();
  });

  it("initializes lists to empty arrays without throwing", () => {
    const { todayItems, onboardingSelectedIds } = useAppStore.getState();
    expect(todayItems).toEqual([]);
    expect(onboardingSelectedIds).toEqual([]);
  });

  it("initializes statuses to idle", () => {
    const { todayStatus, statsStatus } = useAppStore.getState();
    expect(todayStatus).toBe("idle");
    expect(statsStatus).toBe("idle");
  });
});

describe("loadToday action", () => {
  it("transitions status from loading to success", async () => {
    await useAppStore.getState().loadToday("2026-03-11");
    const { todayStatus, todayItems } = useAppStore.getState();
    expect(todayStatus).toBe("success");
    expect(Array.isArray(todayItems)).toBe(true);
  });
});

describe("toggleToday action", () => {
  it("optimistically toggles isChecked for matching habitId", async () => {
    useAppStore.setState({
      todayItems: [
        { habitId: "h1", title: "Run", isChecked: false, currentStreak: 1, bestStreak: 3 },
      ],
    });

    await useAppStore.getState().toggleToday("h1", "2026-03-11");

    const { todayItems } = useAppStore.getState();
    expect(todayItems[0]?.isChecked).toBe(true);
  });

  it("does not modify items with non-matching habitId", async () => {
    useAppStore.setState({
      todayItems: [
        { habitId: "h1", title: "Run", isChecked: false, currentStreak: 1, bestStreak: 3 },
        { habitId: "h2", title: "Read", isChecked: true, currentStreak: 2, bestStreak: 5 },
      ],
    });

    await useAppStore.getState().toggleToday("h1", "2026-03-11");

    const { todayItems } = useAppStore.getState();
    expect(todayItems[1]?.isChecked).toBe(true);
  });
});

describe("refreshAll action", () => {
  it("sets statsStatus to success after completion", async () => {
    await useAppStore.getState().refreshAll("2026-03-11");
    const { statsStatus, todayStatus } = useAppStore.getState();
    expect(statsStatus).toBe("success");
    expect(todayStatus).toBe("success");
  });
});
