# Mobile-Friendly Plan for Globe (PeopleCRM)

## Current State

Globe is a Next.js 16 / React 19 personal CRM with a map-based dashboard, CRM table view, and interaction tracking. It already has **partial** mobile support via Tailwind responsive classes (collapsible nav, stacked layouts, responsive typography). However, several areas need work for a good mobile experience, and there's no PWA or native app setup.

## Strategy

1. **Now**: Improve responsive web experience (Phases 1-3 below)
2. **Later**: Build a native iOS app in Swift (Phase 4) in the same monorepo

### Repo Structure

```
globe/
├── apps/
│   ├── web/              # Next.js app (current codebase)
│   └── ios/              # Swift/Xcode project (added later)
├── supabase/             # Shared backend: migrations, edge functions, seed data
├── contracts/            # Shared docs only — API schemas, DB types reference, conventions
│   ├── db-schema.md      # Single source of truth for table definitions
│   └── api-conventions.md
└── README.md
```

- **No shared runtime code** — web uses TypeScript, iOS uses Swift. Each app owns its own types and API layer.
- **`supabase/`** is the single source of truth for the backend (migrations, RLS policies, edge functions).
- **`contracts/`** is lightweight documentation so both apps agree on API shapes and naming, not importable code.

---

## Phase 1: Fix Mobile UX Issues (Responsive Web)

### 1.1 Navigation
- Convert sidebar to a bottom tab bar on mobile (`md:` breakpoint)
- Tabs: Map, CRM, Search, Profile
- Keep sidebar for desktop

### 1.2 Dashboard (Map View)
- Make the side panel a bottom sheet (slide up from bottom) on mobile instead of a fixed right panel
- Add a floating action button (FAB) for "Add Person" on mobile
- Ensure map controls (zoom, locate) don't overlap with bottom sheet or nav

### 1.3 CRM Table
- Replace the wide table with a card/list view on mobile (each person = one card)
- Show name, company, location, last interaction on the card
- Tap card to expand details (instead of expandable table rows)
- Keep the table view on desktop

### 1.4 Search & Filters
- Make search full-screen overlay on mobile (tap search icon → full screen input)
- Filters as a bottom sheet or collapsible accordion instead of inline panel

### 1.5 Modals (Add/Edit Person)
- Make modals full-screen on mobile instead of centered overlays
- Ensure form inputs are large enough for touch (min 44px tap targets)
- Handle keyboard properly (viewport resize, scroll to focused input)

### 1.6 Typography & Spacing
- Audit all text sizes for mobile readability (minimum 14px body text)
- Ensure adequate touch targets (44x44px minimum per Apple HIG)
- Review padding/margins for thumb-friendly spacing

---

## Phase 2: PWA Setup

### 2.1 Web App Manifest
- Create `public/manifest.json` with app name, icons, theme color, display: standalone
- Generate icon set (192x192, 512x512 minimum)

### 2.2 Service Worker
- Add `next-pwa` or use Next.js built-in service worker support
- Cache static assets and API responses for offline browsing
- Show offline indicator when network is unavailable

### 2.3 Install Prompt
- Add "Add to Home Screen" banner/prompt for mobile users
- Store dismissal preference in localStorage

### 2.4 Meta Tags
- Add `apple-mobile-web-app-capable`, `theme-color`, status bar style
- Add splash screen images for iOS

---

## Phase 3: Mobile-Specific Features (Optional)

### 3.1 Touch Gestures
- Swipe on CRM cards for quick actions (edit, log interaction)
- Pull-to-refresh on list views
- Pinch-to-zoom already handled by Maplibre

### 3.2 Quick Actions
- Long-press on a person to call/email/message
- Share contact via Web Share API

### 3.3 Push Notifications
- Reminder to follow up with contacts (via service worker + Supabase edge functions)

---

## Phase 4: Native iOS App (Swift — Separate Repo)

A standalone Swift app in its own repo, consuming the same Supabase backend.

### 4.1 Project Setup
- Xcode project at `apps/ios/`, targeting iOS 17+
- Swift Package Manager for dependencies
- Supabase Swift SDK (`supabase-swift`) for auth and database

### 4.2 Architecture
- **SwiftUI** for all UI
- **MVVM** pattern with `@Observable` (Swift 5.9+)
- Shared Supabase client singleton for auth + API
- Same Supabase project/keys as the web app — no backend changes needed

### 4.3 Core Screens (mirroring web)
- **Map View**: MapKit with custom annotations for contacts, clustering
- **People List**: `List` / `LazyVStack` with search, pull-to-refresh
- **Person Detail**: Contact info, interaction history, edit form
- **Add/Edit Person**: Form with MapKit place search (replacing Google Places)
- **Organizations & Events**: List + detail views
- **Login/Signup**: Supabase Auth (email/password, Google OAuth via ASWebAuthenticationSession)

### 4.4 iOS-Native Features
- **Contacts integration**: Import/link from iOS Contacts (`CNContactStore`)
- **MapKit**: Native Apple Maps with smooth performance, Look Around
- **Widgets**: WidgetKit for "follow up with" reminders on home screen
- **Push notifications**: APNs via Supabase Edge Functions
- **Spotlight search**: Index contacts for system-wide search
- **Shortcuts**: Siri Shortcuts for "Log interaction with [person]"
- **Share extension**: Share a contact or note from other apps into Globe
- **Haptics**: Tactile feedback on interactions

### 4.5 Data & Sync
- Same Supabase Postgres database — no migration needed
- Supabase Realtime for live updates across web and iOS
- Core Data or SwiftData for offline cache
- Background refresh (`BGAppRefreshTask`) to keep data current

### 4.6 Distribution
- TestFlight for beta testing
- App Store submission (requires Apple Developer Program, $99/year)
- App Store assets: screenshots, description, privacy policy

---

## Implementation Priority

1. **Navigation → bottom tab bar on mobile** (highest impact)
2. **CRM → card view on mobile** (the table is unusable on small screens)
3. **Side panel → bottom sheet on mobile** (map dashboard usability)
4. **Modals → full-screen on mobile** (form usability)
5. **PWA manifest + service worker** (installability)
6. **Search overlay + filter sheet** (polish)
7. **Touch gestures + quick actions** (delight)
