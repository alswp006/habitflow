/** One row in the Today checklist: habit + today's check state + streaks */
export interface TodayHabitItem {
  habitId: string;
  title: string;
  isChecked: boolean;
  currentStreak: number;
  bestStreak: number;
}

/** A single day column in the weekly bar chart (Mon–Sun) */
export interface WeeklyDayStat {
  /** "YYYY-MM-DD" */
  date: string;
  /** 0.0 – 1.0 */
  completionRate: number;
  checkedCount: number;
  totalCount: number;
}

/** Per-habit breakdown row in the weekly stats view */
export interface WeeklyHabitBreakdown {
  habitId: string;
  title: string;
  checkedDays: number;
  /** 0.0 – 1.0 */
  completionRate: number;
}

/** A single day cell in the monthly completion chart */
export interface MonthlyDayStat {
  /** "YYYY-MM-DD" */
  date: string;
  /** 0.0 – 1.0 */
  completionRate: number;
  checkedCount: number;
  totalCount: number;
}

/** Weekday distribution row for the premium habit-pattern screen */
export interface HabitPatternStat {
  habitId: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  checkedCount: number;
  /** 0.0 – 1.0 */
  rate: number;
}
