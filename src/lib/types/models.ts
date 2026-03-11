export interface Habit {
  id: string; // UUID
  title: string; // 1..50 chars
  createdAt: string; // ISO
  isActive: boolean;
  currentStreak: number; // integer >= 0
  bestStreak: number; // integer >= 0
}

export interface CheckIn {
  id: string; // UUID
  habitId: string; // FK to Habit.id
  date: string; // "YYYY-MM-DD" in local time
  checkedAt: string; // ISO
  isSynced: boolean;
}

export type SubscriptionTier = "free" | "premium";

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: string | null; // ISO, null for free
}

export interface HabitRecommendation {
  id: string; // UUID or stable string id from server
  title: string; // 1..50 chars
  isPopular: boolean;
  sortOrder: number; // integer
}
