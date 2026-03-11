# TASKS

## Epic 1. TypeScript types + interfaces (`src/lib/types/`)

### Task 1.1 Entity model types (Habit, CheckIn, Subscription, HabitRecommendation)
- Description: Add pure TypeScript types for all entities exactly as defined in SPEC.
- DoD:
  - `src/lib/types/models.ts` exports `Habit`, `CheckIn`, `SubscriptionTier`, `Subscription`, `HabitRecommendation`.
  - `tsc` passes in `strict` mode (no `any` added).
  - Types exactly match the SPEC definitions.
- Covers: [F1-AC2, F2-AC1, F3-AC1]
- Files:  
  - `src/lib/types/models.ts`
  - `src/lib/types/index.ts`
- Depends on: none

### Task 1.2 Typed Result/Error primitives for repos + API
- Description: Create typed `Result`/error shapes so repository methods can return typed failures and prevent unhandled promise rejections in UI.
- DoD:
  - `src/lib/types/result.ts` exports `Ok<T>`, `Err<E>`, `Result<T,E>`, `isOk`, `isErr`.
  - `src/lib/types/errors.ts` exports discriminated unions `RepoError` and `ApiError` including `{ type: "db" }`, `{ type: "network" }`, `{ type: "unknown" }`.
  - All exports type-check in strict mode.
  - Test code demonstrates repository methods can return `Result` with error typed as `RepoError`.
- Covers: [F1-AC5]
- Files:
  - `src/lib/types/result.ts`
  - `src/lib/types/errors.ts`
  - `src/lib/types/index.ts`
- Depends on: Task 1.1

### Task 1.3 View-model types for Today + Stats aggregations
- Description: Add pure types used by UI for Today habit items and Stats weekly/monthly/pattern aggregations to be consumed by UI without runtime logic.
- DoD:
  - `src/lib/types/viewModels.ts` exports all required view-model types:
    - `TodayHabitItem` = Habit + `{ isChecked: boolean }`
    - `WeeklyDayStat` with `{ date: string; completed: number; total: number }`
    - `WeeklyHabitBreakdown` with `{ habitId: string; title: string; checkedDays: number; totalDays: number; percent: number }`
    - `MonthlyDayStat` and `HabitPatternStat` types suitable for premium screens.
  - All types compile with strict TS, no errors.
- Covers: [F3-AC1, Stats loading and empty states]
- Files:
  - `src/lib/types/viewModels.ts`
  - `src/lib/types/index.ts`
- Depends on: Task 1.1

---

## Epic 2. Data storage + repositories (`src/lib/db/`, `src/lib/db/repos/`)

### Task 2.1 SQLite db adapter + schema/migration (init only)
- Description: Initialize SQLite client and implement database schema initialization to create tables `habits` and `checkins` with all columns and constraints including unique `(habitId, date)` on `checkins`.
- DoD:
  - `initDb()` function exists and runs without throwing errors.
  - Tables created with exact columns and types:
    - `habits(id TEXT PRIMARY KEY, title TEXT, createdAt TEXT, isActive INTEGER, currentStreak INTEGER, bestStreak INTEGER)`
    - `checkins(id TEXT PRIMARY KEY, habitId TEXT, date TEXT, checkedAt TEXT, isSynced INTEGER, UNIQUE(habitId, date))`
  - Schema verified by querying `sqlite_master` after init.
  - Unit or integration tests confirm schema created correctly.
- Covers: [F1-AC1]
- Files:
  - `src/lib/db/client.ts`
  - `src/lib/db/migrations.ts`
  - `src/lib/db/index.ts`
- Depends on: Task 1.1

### Task 2.2 Habits repository: upsert + list active + count active
- Description: Implement `upsertHabit(habit)`, `getHabits({ activeOnly: boolean })` and `countActiveHabits()` methods for habits repository to support local persistence.
- DoD:
  - `upsertHabit(habit: Habit)` inserts or updates habit by `id`.
  - `getHabits({ activeOnly: true })` returns only habits with `isActive=1`.
  - `countActiveHabits()` returns count of active habits as number.
  - All methods return `Result` type with `RepoError` on failure, never throw uncaught errors.
  - Unit tests verify correct behavior including upsert and filtering of active habits.
- Covers: [F1-AC2, F3-AC6, F2-AC7]
- Files:
  - `src/lib/db/repos/habitsRepo.ts`
  - `src/lib/db/repos/index.ts`
- Depends on: Task 2.1, Task 1.2

### Task 2.3 Check-ins repository: toggle + get-by-date + unsynced list
- Description: Implement check-in repository methods:
  - `toggleCheckIn(habitId, date, checkedAtISO)` performs deterministic toggle: 
    - first call inserts a row,
    - second call removes the row,
    - no duplicates occur.
  - `getCheckInsByDate(date)` returns all check-ins for a given date.
  - `listUnsyncedCheckIns()` returns unsynced check-ins sorted by oldest `checkedAt`.
- DoD:
  - `toggleCheckIn()` invoked twice on same `(habitId, date)` creates then removes a single row accordingly.
  - Query for check-ins by date returns exact set.
  - Query for unsynced check-ins orders results properly.
  - All repository methods return `Result` with `RepoError` on failure, no uncaught errors thrown.
  - Unit tests verify toggle toggles count, uniqueness, and ordering.
- Covers: [F1-AC3, F1-AC6, Offline queue ordering req]
- Files:
  - `src/lib/db/repos/checkinsRepo.ts`
  - `src/lib/db/repos/index.ts`
- Depends on: Task 2.1, Task 1.1, Task 1.2

### Task 2.4 Today query repository: `getTodayHabitsWithCheckState(date)`
- Description: Implement repository method to return all active habits for a date plus check state joined from checkins.
- DoD:
  - Returns list length equal to number of active habits.
  - Exactly the habits with check-in on `date` have `isChecked: true`.
  - Return type is `Result<TodayHabitItem[], RepoError>`.
  - No uncaught errors thrown.
  - Unit tests with sample data demonstrate correctness.
- Covers: [F1-AC4, F3-AC1]
- Files:
  - `src/lib/db/repos/todayRepo.ts`
  - `src/lib/db/repos/index.ts`
- Depends on: Task 2.2, Task 2.3, Task 1.3, Task 1.2

### Task 2.5 Stats (weekly) aggregation repository
- Description: Implement repository methods to fetch weekly stats (Mon-Sun) overall and per habit for current week:
  - `getWeeklyOverallStats(weekStartDate)`: returns 7 days with completed and total counts.
  - `getWeeklyHabitBreakdown(weekStartDate)`: returns one row per active habit with percent and checkedDays.
- DoD:
  - Methods return typed `Result` with no uncaught errors.
  - Unit tests verify aggregation correctness for sample data.
- Covers: [Stats tab: weekly chart + list]
- Files:
  - `src/lib/db/repos/statsWeeklyRepo.ts`
  - `src/lib/db/repos/index.ts`
- Depends on: Task 2.2, Task 2.3, Task 1.3, Task 1.2

### Task 2.6 Stats (monthly) aggregation repository (premium screen support)
- Description: Implement monthly aggregation for selected month:
  - `getMonthlyOverallStats(monthKey)`: returns daily buckets with completion data.
  - `getMonthlyHabitBreakdown(monthKey)`: returns per-habit breakdown for the month.
- DoD:
  - Methods return typed `Result` with no uncaught errors.
  - Unit tests verify correctness on sample data.
- Covers: [Premium Monthly Stats gated screen]
- Files:
  - `src/lib/db/repos/statsMonthlyRepo.ts`
  - `src/lib/db/repos/index.ts`
- Depends on: Task 2.2, Task 2.3, Task 1.3, Task 1.2

### Task 2.7 Subscription local persistence via SecureStore
- Description: Implement local read/write of Subscription in SecureStore.
- DoD:
  - Methods `getSubscription()` and `saveSubscription()` implemented.
  - Uses `expo-secure-store` API.
  - Writes and reads stored JSON object correctly.
  - Errors are handled by returning typed failure results.
  - Unit tests cover storage and retrieval.
- Covers: [Subscription local caching and fallback]
- Files:
  - `src/lib/db/repos/subscriptionRepo.ts`
  - `src/lib/db/repos/index.ts`
- Depends on: Task 1.2

---

## Epic 3. API Routes (`src/app/api/`)

### Task 3.1 API client methods for Habits, CheckIns, Subscription, and HabitRecommendations
- Description: Implement reusable API client methods to:
  - Fetch `/habits`
  - Fetch and upsert `/checkins`
  - Fetch `/subscription`
  - Fetch `/habit-recommendations`
- DoD:
  - All methods typed for request/response bodies.
  - Handle errors returning typed `ApiError`.
  - Methods mocked for MVP; no real network calls needed for core offline.
  - Unit tests confirm typings and mock responses.
- Covers: [All API interactions in SPEC]
- Files:
  - `src/lib/api/client.ts`
- Depends on: Task 1.2

### Task 3.2 Sync mechanism API calls for habits, check-ins, and subscription
- Description: Implement sync functions that:
  - Fetch habits from server and upsert into local DB.
  - Upload unsynced check-ins, mark synced locally on success.
  - Fetch subscription and update SecureStore cache.
- DoD:
  - Sync methods return typed `Result`.
  - Sync respects conflict rules.
  - Errors propagate as typed errors.
  - Unit tests simulate network success and failure.
- Covers: [F1-AC6, Sync offline-first principles]
- Files:
  - `src/lib/api/sync.ts`
- Depends on: Task 3.1, Task 2.2, Task 2.3, Task 2.7

---

## Epic 4. Core UI pages (`src/app/`)

### Task 4.1 Onboarding Modal page (`/onboarding`)
- Description: Implement `/onboarding` page with layout:
  - SafeAreaView top container
  - Header with app name and subtitle
  - FlatList of recommended habits with selectable rows (checkbox style)
  - Divider
  - “Create custom habit” button navigating to Habit Create
  - Primary CTA “Start” disabled if < 2 selected
  - Pull-to-refresh support for recommendations with skeleton loading, empty and error states
- DoD:
  - Skeleton placeholder rows shown while fetching (5 rows)
  - Tapping row toggles selected state, tap area ≥ 44x44 points
  - “Start” disabled if selected count < 2, enabled otherwise
  - “Start” creates selected habits locally and navigates to `/(tabs)/today`
  - “Retry” button shown and functional on error (500)
  - Pull-to-refresh stops within 2 seconds and shows inline offline/error message if offline
  - If free tier with 3 active habits, trying to add more navigates to `/premium`
- Covers: [F2-AC1 to AC7]
- Files:
  - `src/app/onboarding.tsx`
- Depends on: Task 2.2, Task 3.1

### Task 4.2 Habit Create page (`/habit/new`)
- Description: Implement habit creation page with:
  - SafeAreaView + KeyboardAvoidingView
  - Title input with max 50 chars and live helper text showing remaining chars
  - “Save” CTA disables inputs and shows loading spinner on saving
  - “Cancel” button navigates back
  - Validation error under input; inline API error banner
- DoD:
  - Input enforces max length 50
  - “Save” saves habit via local repo (calls `upsertHabit`)
  - Save disables inputs, shows loading while saving
  - Shows validation errors below input
  - “Cancel” navigates back
  - Errors caught and displayed inline
- Covers: [F2-AC4, Habit creation flow]
- Files:
  - `src/app/habit/new.tsx`
- Depends on: Task 2.2

### Task 4.3 Today tab page (`/(tabs)/today`)
- Description: Implement Today screen with:
  - SafeAreaView top container
  - Header: “Today” + subtext date string
  - FlatList of active habits with rows showing title, current streak, best streak, tappable check indicator (hit area ≥44x44)
  - Skeleton rows while local data loads
  - Empty state plus “Add habit” button navigating to habit creation
  - Tap row or check indicator toggles check-in with latency ≤ 300 ms after SQLite write
  - Pull-to-refresh triggers sync of unsynced check-ins, refetches habits, and ends spinner
  - Displays “All done for today” header message if all habits checked
  - Offline toggle works with local effects and sync pending indicator
  - Inactive habits do not appear
- DoD:
  - Skeleton shows on initial load until data present
  - Tap toggles check-in immediately reflected
  - Pull-to-refresh triggers sync steps
  - “All done” message displays if all checked
  - Offline mode allows toggling with local update and UI indicates unsynced
  - Inactive habits excluded
- Covers: [F3-AC1 to AC7]
- Files:
  - `src/app/(tabs)/today.tsx`
- Depends on: Task 2.4, Task 3.2

### Task 4.4 Stats tab page (`/(tabs)/stats`)
- Description: Build Stats screen with:
  - SafeAreaView
  - Header “Stats”
  - Weekly bar chart (Mon-Sun) overall completion
  - FlatList habit breakdown with title, % complete, checked days count
  - Skeletons while loading
  - Empty states as SPEC describes
  - Error inline with retry
  - Pull-to-refresh calls sync + refetch + aggregation recompute
- DoD:
  - Chart and list fill with correct computed data
  - Skeletons seen during load
  - Empty and error states appear appropriately
  - Pull-to-refresh successful triggers recomputations and ends spinner
- Covers: [Stats tab requirements]
- Files:
  - `src/app/(tabs)/stats.tsx`
- Depends on: Task 2.5, Task 3.2

### Task 4.5 Profile tab page (`/(tabs)/profile`)
- Description: Implement Profile screen:
  - SafeAreaView container
  - Subscription section with tier badge, expiration, and “Upgrade” button
  - Habits section with count and free tier limit messaging
  - FlatList with habit rows (title and active status)
  - Skeletons for subscription and habits list
  - Empty states with “Add habit”
  - Inline error and retry for subscription fetch failure
  - Pull-to-refresh triggers subscription refetch + sync + habit refetch
- DoD:
  - All UI sections implemented and styled
  - Pull-to-refresh refreshes data and ends spinner
  - Inline error and retry function properly
- Covers: [Profile tab requirements]
- Files:
  - `src/app/(tabs)/profile.tsx`
- Depends on: Task 2.2, Task 2.7, Task 3.2

### Task 4.6 Premium Upsell page (`/premium`)
- Description: Create premium upsell page:
  - SafeAreaView container
  - Plan comparison card (free vs premium features list)
  - CTA “I’ve upgraded (Refresh status)” with loading spinner on refresh
  - Secondary back button
  - Inline error + retry on refresh failure
- DoD:
  - Refresh re-fetches subscription and updates UI
  - Loading indication shown while refreshing
  - Error handled inline with retry
  - Back button navigates back
- Covers: [Premium Upsell]
- Files:
  - `src/app/premium.tsx`
- Depends on: Task 2.7, Task 3.2

### Task 4.7 Premium Monthly Stats page (`/stats/monthly`)
- Description: Render premium gated monthly stats or locked state:
  - SafeAreaView container
  - If premium tier:
    - Month selector control
    - Monthly completion chart + habit breakdown list
  - If free tier:
    - Locked state with button to `/premium`
  - Loading, empty, error states like weekly stats
  - Pull-to-refresh triggers sync and recompute
- DoD:
  - Correct UI displays depending on tier
  - Month selection changes data displayed
  - Pull-to-refresh functions and spinner handled
  - Loading skeletons and empty/error states present
- Covers: [Premium Monthly Stats gated]
- Files:
  - `src/app/stats/monthly.tsx`
- Depends on: Task 2.6, Task 2.7, Task 3.2

### Task 4.8 Premium Habit Pattern page (`/stats/patterns/[habitId]`)
- Description: Show premium gated habit pattern details:
  - SafeAreaView container
  - If premium:
    - Habit title header
    - Simple pattern summary (weekday distribution)
    - List of detailed pattern stats
  - If free:
    - Locked state + button to `/premium`
  - Loading, empty, error states with retry
  - Pull-to-refresh sync + recompute
- DoD:
  - UI adapts to subscription tier
  - Data fetch and render correct
  - Pull-to-refresh implemented with spinner and error handling
- Covers: [Premium Habit Pattern gated]
- Files:
  - `src/app/stats/patterns/[habitId].tsx`
- Depends on: Task 2.6, Task 2.7, Task 3.2

---

## Epic 5. Integration + Navigation + Landing Page

### Task 5.1 Navigation integration and landing setup
- Description: Ensure all routes and screens registered with `expo-router` navigation:
  - Tabs for Today, Stats, Profile
  - Modals for Onboarding, Habit Create
  - Premium and gated stats routes
  - Appropriate navigation flow for onboarding completion to today tab
- DoD:
  - Navigation tabs and stacks work without error
  - Onboarding modal shows on first launch; navigating back returns to prior state
  - Linking between screens works as specified in SPEC
  - Unit test or manual test confirms navigation correctness
- Covers: [Full flow navigation integration]
- Files:
  - `src/app/(tabs)/_layout.tsx`
  - `src/app/_layout.tsx`
  - Navigation config files if needed
- Depends on: All Task 4 tasks

### Task 5.2 Landing page setup
- Description: Implement base landing page (e.g., splash or redirect depending on auth + onboarding completion).
- DoD:
  - Rendering of landing page checks:
    - If user needs onboarding, navigate to `/onboarding`
    - Else navigate to `/ (tabs)/today`
  - Page uses SafeAreaView
  - Shows minimal loading or placeholder
- Covers: [Initial launch flow]
- Files:
  - `src/app/index.tsx`
- Depends on: Task 5.1