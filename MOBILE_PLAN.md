# Mobile-Friendly Plan for Globe (PeopleCRM)

## Current State

Globe is a Next.js 16 / React 19 personal CRM with a map-based dashboard, CRM table view, and interaction tracking. It already has **partial** mobile support via Tailwind responsive classes (collapsible nav, stacked layouts, responsive typography). However, several areas need work for a good mobile experience, and there's no PWA or native app setup.

## Decision: PWA vs Native App vs Responsive Web

| Approach | Pros | Cons |
|----------|------|------|
| **Responsive Web (current path)** | No new tooling, works now, single codebase | No offline, no home screen, no push notifications |
| **PWA (recommended first step)** | Home screen install, offline caching, push notifications, still one codebase | Limited iOS Safari support for some APIs |
| **Native App (React Native / Expo)** | Full native feel, access to contacts/camera/etc. | Separate codebase, app store review, significant effort |

**Recommendation:** Improve responsive design first, then add PWA support. Consider a native app later only if needed for features like contact sync or camera access.

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

## Phase 4: Native App (Future, if needed)

Only pursue this if the PWA approach doesn't meet needs. Would likely use:
- **Expo / React Native** with shared business logic
- **Capacitor** as a lighter alternative (wraps the web app in a native shell)
- Key native-only features: contact book sync, background location, widgets

---

## Implementation Priority

1. **Navigation → bottom tab bar on mobile** (highest impact)
2. **CRM → card view on mobile** (the table is unusable on small screens)
3. **Side panel → bottom sheet on mobile** (map dashboard usability)
4. **Modals → full-screen on mobile** (form usability)
5. **PWA manifest + service worker** (installability)
6. **Search overlay + filter sheet** (polish)
7. **Touch gestures + quick actions** (delight)
