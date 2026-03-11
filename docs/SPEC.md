# SPEC

## Common Principles

- **Tech constraints**
  - React Native (Expo SDK 52), TypeScript `strict`, NativeWind, `expo-router`.
  - Existing repo components/navigation/auth are reused (tabs + login/signup + shared UI components + zustand + API client + SecureStore).

- **Performance/UX goal**
  - Primary daily flow: open app → see Today list immediately → 1-tap check/uncheck per habit → quick streak + progress visibility.

- **Safe area**
  - Every screen uses `SafeAreaView` (from `react-native-safe-area-context`) as the top-level container.

- **Touch targets**
  - All tappable row items and icon buttons have a minimum hit size of **44x44** points (via padding/minHeight/minWidth).

- **Lists**
  - Every `FlatList`/scrollable list view includes **pull-to-refresh** (`RefreshControl`) that triggers a defined refetch/sync action.

- **Forms**
  - Every screen with text input uses `KeyboardAvoidingView` and ensures the primary CTA remains reachable while the keyboard is open (iOS `padding`, Android `height`).

- **Images**
  - MVP contains **no user-provided images** and no remote images are required by the PRD. (If a future version adds icons/images, a skeleton/placeholder must be shown until the image load resolves.)

- **Offline-first**
  - Core interactions (view Today, toggle check-in) must work without network by reading/writing local SQLite.
  - Sync is “best effort”: unsynced check-ins are queued locally and retried on explicit refresh and on app foreground/open.

- **Screen Definitions (routes, UI, states, gestures)**

  1) **Onboarding Modal** — `/onboarding`
  - **Layout**
    - `SafeAreaView`
    - Header: app name + short subtitle
    - `FlatList` of recommended habits (3–5 items from API) with selectable rows (checkbox-like UI)
    - Divider
    - “Create custom habit” button (navigates to Habit Create)
    - Primary CTA: “Start” (enabled when selection count ≥ 2)
  - **Loading**
    - Show list skeleton rows (fixed count 5) while recommendations load.
  - **Empty**
    - If recommendations response is empty: show message + “Create custom habit” button + disabled “Start” until 2 custom habits exist.
  - **Error**
    - Show inline error text and “Retry” button; allow “Create custom habit” even when fetch fails.
  - **Gestures**
    - Tap row toggles selection (hit target ≥ 44x44).
    - Pull-to-refresh refetches recommendations and re-renders list.

  2) **Habit Create** — `/habit/new`
  - **Layout**
    - `SafeAreaView` + `KeyboardAvoidingView`
    - Title input (single field)
    - Helper text showing remaining characters
    - Primary CTA “Save”
    - Secondary “Cancel” (go back)
  - **Loading**
    - “Save” shows loading spinner and disables inputs while request/local write is in progress.
  - **Error**
    - Validation error shown under input; API error shown as inline banner.
  - **Gestures**
    - None beyond standard taps; tap outside does not dismiss required content.

  3) **Today (tab)** — `/ (tabs)/today`
  - **Layout**
    - `SafeAreaView`
    - Header: “Today” + small subtext (e.g., date)
    - `FlatList` of active habits
      - Each row: title, streak summary (current/best), and a tappable check indicator
  - **Loading**
    - On first mount: show skeleton list rows until local DB read completes (even offline).
  - **Empty**
    - If no active habits: show empty state + “Add habit” button → Habit Create.
  - **Error**
    - If local DB read fails: show error state with “Retry” that re-reads local DB.
  - **Gestures**
    - Tap row or check indicator toggles today’s check-in.
    - Pull-to-refresh triggers: (1) sync queued check-ins, then (2) fetch habits/check-ins from API and update local cache.

  4) **Stats (tab)** — `/ (tabs)/stats`
  - **Layout**
    - `SafeAreaView`
    - Header: “Stats”
    - Weekly bar chart (Mon–Sun) for overall completion rate
    - `FlatList` breakdown by habit for the current week (habit title + % + checked days count)
  - **Loading**
    - Show skeleton chart block + skeleton list rows until local aggregation completes.
  - **Empty**
    - If no habits: show empty with CTA to add habit.
    - If habits exist but no check-ins this week: show “No check-ins yet this week” message and show 0% bars.
  - **Error**
    - If local aggregation fails: show inline error + “Retry”.
  - **Gestures**
    - Pull-to-refresh triggers sync + refetch then recompute aggregates.

  5) **Profile (tab)** — `/ (tabs)/profile`
  - **Layout**
    - `SafeAreaView`
    - Section: Subscription (tier badge + expiration if present) + “Upgrade” button
    - Section: Habits (count, limit messaging for free tier)
    - `FlatList` of habits with simple rows (title, active status)
  - **Loading**
    - Skeleton for subscription + habits list until local load finishes; if API fetch is in progress, show a small loading indicator in header.
  - **Empty**
    - If no habits: show empty + “Add habit”.
  - **Error**
    - If subscription fetch fails: show “Couldn’t load subscription” inline + “Retry”.
  - **Gestures**
    - Pull-to-refresh triggers subscription refetch + sync + habit refetch.

  6) **Premium Upsell** — `/premium`
  - **Layout**
    - `SafeAreaView`
    - Plan comparison card (Free vs Premium features)
    - CTA “I’ve upgraded (Refresh status)” (re-fetch subscription from API)
    - Secondary “Back”
  - **Loading**
    - CTA shows spinner while refreshing subscription.
  - **Error**
    - If refresh fails: inline error + retry.

  7) **Premium Monthly Stats (gated)** — `/stats/monthly`
  - **Layout**
    - `SafeAreaView`
    - If premium: show month selector + monthly completion chart + breakdown list
    - If free: show locked state + button to `/premium`
  - **Loading/Empty/Error**
    - Same patterns as Stats weekly.
  - **Gestures**
    - Pull-to-refresh behaves like Stats.

  8) **Premium Habit Pattern (gated)** — `/stats/patterns/[habitId]`
  - **Layout**
    - `SafeAreaView`
    - If premium: habit title + simple pattern summary (e.g., weekday distribution for current month) + list
    - If free: locked state + button to `/premium`
  - **Loading/Empty/Error**
    - Loading skeleton, empty if no data, inline error with retry.
  - **Gestures**
    - Pull-to-refresh triggers sync + recompute.

---

## Data Models

### Habit — fields, types, constraints

```ts
export interface Habit {
  id: string; // UUID
  title: string; // 1..50 chars
  createdAt: string; // ISO
  isActive: boolean;
  currentStreak: number; // integer >= 0
  bestStreak: number; // integer >= 0
}
```

- **Storage method**
  - Local: **SQLite** (`habits` table).
  - Remote: API (`/habits`).
- **Sync strategy**
  - On app load/refresh: fetch remote habits → upsert into SQLite by `id`.
  - Conflict rule (MVP): server is source of truth for habit fields; local-only habits are created by POST then updated with server response.

---

### CheckIn — fields, types, constraints

```ts
export interface CheckIn {
  id: string; // UUID
  habitId: string; // FK to Habit.id
  date: string; // "YYYY-MM-DD" in local time
  checkedAt: string; // ISO
  isSynced: boolean;
  // Derived in UI: isChecked (exists for habitId+date)
}
```

- **Storage method**
  - Local: **SQLite** (`checkins` table) with unique constraint on `(habitId, date)` to represent “one per day per habit”.
  - Remote: API (`/checkins` upsert + range fetch).
- **Sync strategy**
  - Any local toggle writes/updates SQLite immediately with `isSynced = false` if API call fails.
  - Sync engine retries unsynced rows in ascending `checkedAt` order.
  - Conflict rule: “last write wins” by `checkedAt` (client sends `checkedAt`; server resolves by latest timestamp).

---

### Subscription — fields, types, constraints

```ts
export type SubscriptionTier = "free" | "premium";

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: string | null; // ISO, null for free
}
```

- **Storage method**
  - Local: **SecureStore** for last known tier (fast boot) + SQLite optional caching not required.
  - Remote: API (`/subscription`).
- **Sync strategy**
  - On app start and pull-to-refresh: fetch subscription and update SecureStore.
  - If API fails: use last known value from SecureStore.

---

### HabitRecommendation — fields, types, constraints

```ts
export interface HabitRecommendation {
  id: string; // UUID or stable string id from server
  title: string; // 1..50 chars
  isPopular: boolean;
  sortOrder: number; // integer
}
```

- **Storage method**
  - Remote: API (`/habit-recommendations`).
  - Local caching: not required for MVP; may keep in memory (zustand) for the session.
- **Sync strategy**
  - Fetch on onboarding open; refetch on pull-to-refresh.

---

## Feature List

### F1. Local Persistence (SQLite) + Repository Layer
- Description: Implement SQLite tables and a small repository layer to read/write habits and check-ins locally in a deterministic way. This enables instant Today rendering and supports offline check-in toggling without waiting for network.
- Data: `Habit`, `CheckIn`
- API: (none required to complete core persistence)
- Requirements:
- AC-1: Given a fresh install, When the app initializes the database, Then the SQLite tables `habits` and `checkins` exist with a unique constraint on `(habitId, date)`.
- AC-2: Given a habit record, When `upsertHabit(habit)` is called, Then `getHabits()` returns a list containing that habit with the same `id` and `title`.
- AC-3: Given a habitId and today’s date, When `toggleCheckIn(habitId, date)` is called twice, Then the first call results in exactly 1 row for `(habitId,date)` and the second call results in 0 rows for `(habitId,date)` (or a deterministic “unchecked” representation), with no duplicates.
- AC-4: Given `getTodayHabitsWithCheckState(date)`, When there are N active habits and M check-ins for that date, Then the result contains N items and exactly M are marked checked.
- AC-5 (failure/edge): Given a database error during read (simulated by throwing in the DB adapter), When a screen calls repository read methods, Then the method returns a typed error result that the UI can render as an error state (not an unhandled promise rejection).
- AC-6 (loading/offline): Given airplane mode enabled, When `toggleCheckIn(habitId, date)` is called, Then the local SQLite write completes and the function returns success without requiring any network.

---

### F2. Onboarding Recommendations + Quick Start Habit Creation
- Description: Provide a first-run onboarding modal that shows 3–5 recommended habits and allows selecting at least 2 to start. Users can also create custom habits directly from onboarding to avoid an empty initial experience.
- Data: `HabitRecommendation`, `Habit`, `Subscription`
- API: `GET /habit-recommendations` → `{ items: HabitRecommendation[] }` | `401, 500`
- Requirements:
- AC-1: Given the user opens `/onboarding`, When recommendations fetch starts, Then the screen shows 5 skeleton rows until the request resolves or fails.
- AC-2: Given recommendations are returned, When the user taps a recommendation row, Then that item’s selected state toggles and the tap target area is at least 44x44 points.
- AC-3: Given fewer than 2 items are selected, When the user views the primary CTA, Then the “Start” button is disabled and cannot navigate to Today.
- AC-4: Given 2 or more items are selected, When the user taps “Start”, Then the app creates corresponding Habit records locally and navigates to `/(tabs)/today`.
- AC-5 (failure/edge): Given the recommendations request returns `500`, When the screen renders the error, Then a “Retry” button is visible and tapping it re-issues `GET /habit-recommendations`.
- AC-6 (loading/offline): Given the device is offline, When the user pulls to refresh the recommendations list, Then the UI stops refreshing within 2 seconds and shows an inline offline/error message while still allowing “Create custom habit”.
- AC-7: Given free tier is active and there are already 3 active habits locally, When the user tries to add more habits from onboarding, Then the app navigates to `/premium` instead of creating additional habits.

---

### F3. Today Checklist: 1-Tap Check/Uncheck + Streak Display
- Description: Show today’s active habit list immediately and allow toggling completion with a single tap per habit. Each habit row displays current streak and best streak and updates after toggling based on local computation until the next server sync.
- Data: `Habit`, `CheckIn`, `Subscription`
- API: `GET /habits` → `{ items: Habit[] }` | `401, 500`
- Requirements:
- AC-1: Given `/ (tabs)/today` is opened, When local data load begins, Then a skeleton list is shown until `getTodayHabitsWithCheckState()` returns.
- AC-2: Given the Today list is visible, When the user taps a habit row, Then the checked state for that habit/date toggles within 300ms based on local SQLite write completion.
- AC-3: Given a habit row is checked for today, When the user taps it again, Then the check-in for that habit/date is removed (or marked unchecked) locally and the UI reflects unchecked state.
- AC-4: Given the Today list, When the user pulls to refresh, Then the app (1) attempts to sync unsynced check-ins, and (2) refetches `/habits`, and (3) ends the refresh spinner.
- AC-5: Given all active habits are checked for today, When the list re-renders, Then a “All done for today” message is shown in the screen header area.
- AC-6 (failure/edge): Given a habit has been made inactive locally, When Today loads, Then inactive habits do not appear in the Today list.
- AC-7 (loading/offline): Given the device is offline, When the user toggles a habit, Then the UI reflects the new state and a local unsynced indicator is available at screen level (e.g., “Sync pending”) without blocking further toggles.

---

### F4. Offline Check-In Queue + Manual/Foreground Sync
- Description: Ensure check-ins created offline are reliably queued and retried later.