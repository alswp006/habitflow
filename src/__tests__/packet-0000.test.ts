import { describe, it, expect } from "vitest";
import type {
  Habit,
  CheckIn,
  SubscriptionTier,
  Subscription,
  HabitRecommendation,
  TodayHabitItem,
  WeeklyDayStat,
  WeeklyHabitBreakdown,
  MonthlyDayStat,
  HabitPatternStat,
  Ok,
  Err,
  Result,
  RepoError,
  ApiError,
} from "@/lib/types";

describe("models types", () => {
  it("Habit satisfies interface shape", () => {
    const habit: Habit = {
      id: "uuid-1",
      title: "Exercise",
      createdAt: "2026-01-01T00:00:00.000Z",
      isActive: true,
      currentStreak: 3,
      bestStreak: 10,
    };
    expect(habit.id).toBe("uuid-1");
    expect(typeof habit.currentStreak).toBe("number");
  });

  it("CheckIn satisfies interface shape", () => {
    const checkIn: CheckIn = {
      id: "uuid-2",
      habitId: "uuid-1",
      date: "2026-03-11",
      checkedAt: "2026-03-11T08:00:00.000Z",
      isSynced: false,
    };
    expect(checkIn.date).toBe("2026-03-11");
    expect(checkIn.isSynced).toBe(false);
  });

  it("Subscription tier is 'free' or 'premium'", () => {
    const free: SubscriptionTier = "free";
    const premium: SubscriptionTier = "premium";
    const sub: Subscription = { tier: free, expiresAt: null };
    const subPremium: Subscription = {
      tier: premium,
      expiresAt: "2027-01-01T00:00:00.000Z",
    };
    expect(sub.tier).toBe("free");
    expect(subPremium.expiresAt).not.toBeNull();
  });

  it("HabitRecommendation satisfies interface shape", () => {
    const rec: HabitRecommendation = {
      id: "rec-1",
      title: "Drink water",
      isPopular: true,
      sortOrder: 0,
    };
    expect(rec.isPopular).toBe(true);
    expect(typeof rec.sortOrder).toBe("number");
  });
});

describe("viewModel types", () => {
  it("TodayHabitItem has expected fields", () => {
    const item: TodayHabitItem = {
      habitId: "h1",
      title: "Read",
      isChecked: false,
      currentStreak: 1,
      bestStreak: 5,
    };
    expect(item.isChecked).toBe(false);
  });

  it("WeeklyDayStat completionRate is a number", () => {
    const stat: WeeklyDayStat = {
      date: "2026-03-09",
      completionRate: 0.75,
      checkedCount: 3,
      totalCount: 4,
    };
    expect(stat.completionRate).toBeLessThanOrEqual(1);
  });

  it("WeeklyHabitBreakdown, MonthlyDayStat, HabitPatternStat have correct shapes", () => {
    const wb: WeeklyHabitBreakdown = {
      habitId: "h1",
      title: "Run",
      checkedDays: 5,
      completionRate: 0.71,
    };
    const md: MonthlyDayStat = {
      date: "2026-03-01",
      completionRate: 1,
      checkedCount: 2,
      totalCount: 2,
    };
    const hp: HabitPatternStat = {
      habitId: "h1",
      dayOfWeek: 1,
      checkedCount: 4,
      rate: 0.8,
    };
    expect(wb.checkedDays).toBe(5);
    expect(md.totalCount).toBe(2);
    expect(hp.dayOfWeek).toBe(1);
  });
});

describe("Result discriminated union", () => {
  it("Ok<T> has ok: true and value", () => {
    const ok: Ok<number> = { ok: true, value: 42 };
    expect(ok.ok).toBe(true);
    expect(ok.value).toBe(42);
  });

  it("Err<E> has ok: false and error", () => {
    const err: Err<string> = { ok: false, error: "oops" };
    expect(err.ok).toBe(false);
    expect(err.error).toBe("oops");
  });

  it("Result<T,E> narrows correctly via ok discriminator", () => {
    const result: Result<number, string> =
      Math.random() > 2 ? { ok: true, value: 1 } : { ok: false, error: "fail" };
    if (result.ok) {
      expect(typeof result.value).toBe("number");
    } else {
      expect(typeof result.error).toBe("string");
    }
  });
});

describe("error union types", () => {
  it("RepoError covers db, not_found, constraint, unknown", () => {
    const db: RepoError = { type: "db", message: "disk error" };
    const nf: RepoError = { type: "not_found", message: "missing" };
    const con: RepoError = { type: "constraint", message: "unique" };
    const unk: RepoError = { type: "unknown", message: "?" };
    expect(db.type).toBe("db");
    expect(nf.type).toBe("not_found");
    expect(con.type).toBe("constraint");
    expect(unk.type).toBe("unknown");
  });

  it("ApiError covers network, http, unauthorized, unknown", () => {
    const net: ApiError = { type: "network", message: "timeout" };
    const http: ApiError = { type: "http", status: 500, message: "server error" };
    const unauth: ApiError = { type: "unauthorized", message: "401" };
    const unk: ApiError = { type: "unknown", message: "?" };
    expect(net.type).toBe("network");
    expect(http.type).toBe("http");
    if (http.type === "http") expect(http.status).toBe(500);
    expect(unauth.type).toBe("unauthorized");
    expect(unk.type).toBe("unknown");
  });
});
