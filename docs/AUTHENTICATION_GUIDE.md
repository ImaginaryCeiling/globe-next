# Authentication System Guide

This guide explains how authentication works in your Globe Next.js application using Supabase Auth.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [How the Pieces Fit Together](#how-the-pieces-fit-together)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Authentication Flow](#authentication-flow)
5. [Setup Instructions](#setup-instructions)
6. [How to Test](#how-to-test)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ Login Page  │    │  App Pages  │    │   AuthProvider Context  │  │
│  │  (client)   │    │  (server)   │    │   (user state + hooks)  │  │
│  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘  │
└─────────┼──────────────────┼───────────────────────┼────────────────┘
          │                  │                       │
          ▼                  ▼                       │
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js Middleware                               │
│         (intercepts every request, validates session)                │
│                   ↓ redirect if no session ↓                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase Auth                                   │
│   ┌────────────┐   ┌────────────┐   ┌────────────────────────────┐  │
│   │   Email/   │   │   OAuth    │   │   Session Management       │  │
│   │  Password  │   │  (Google,  │   │   (cookies, JWT tokens)    │  │
│   │            │   │   GitHub)  │   │                            │  │
│   └────────────┘   └────────────┘   └────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                               │
│              (RLS policies filter data by user_id)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How the Pieces Fit Together

### 1. Three Supabase Clients

We need different Supabase clients for different contexts:

| Client | File | Used In | Purpose |
|--------|------|---------|---------|
| **Server** | `app/utils/supabase/server.ts` | Server Components, API routes | Runs on the server, has access to cookies |
| **Browser** | `app/utils/supabase/client.ts` | Client Components | Runs in browser, for OAuth & real-time |
| **Middleware** | `app/utils/supabase/middleware.ts` | Next.js middleware | Validates sessions at the edge |

### 2. Session Storage: Cookies

Supabase stores the session in cookies (not localStorage). This is important because:

- **Server Components can read cookies** → Server can know who's logged in
- **Middleware can read cookies** → Can protect routes before they render
- **More secure** → HttpOnly cookies can't be stolen by JavaScript

### 3. Protection Layers

Your app has **three layers** of protection:

```
Layer 1: Middleware (route protection)
   ↓ redirects unauthenticated users to /login

Layer 2: API Routes (data protection)
   ↓ returns 401 if no valid session

Layer 3: RLS Policies (database protection)
   ↓ only returns rows where user_id matches
```

---

## File-by-File Breakdown

### `/middleware.ts` — The Gatekeeper

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/app/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [/* matches all routes except static files */]
}
```

**What it does:**
1. Runs on EVERY request (except static files like images)
2. Calls `updateSession()` which checks if user has a valid session
3. If no session → redirects to `/login`
4. If session exists → allows request to continue

**The `matcher` config:**
- Excludes `_next/static`, `_next/image`, and image files
- Without this, the middleware would run on every CSS/JS file too

---

### `/app/utils/supabase/middleware.ts` — Session Validator

```typescript
export async function updateSession(request: NextRequest) {
  // 1. Create a response object we can modify
  let supabaseResponse = NextResponse.next({ request })

  // 2. Create Supabase client with cookie access
  const supabase = createServerClient(URL, KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) { /* set cookies on response */ }
    }
  })

  // 3. Validate the session (this also refreshes expired tokens!)
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Redirect logic
  if (!user && !isPublicRoute) {
    return NextResponse.redirect('/login')
  }

  return supabaseResponse
}
```

**Key concept: `getUser()` vs `getSession()`**

- `getSession()` → Just reads the token from cookies (can be forged!)
- `getUser()` → Validates the token with Supabase servers (secure!)

Always use `getUser()` when checking authentication.

---

### `/app/utils/supabase/client.ts` — Browser Client

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**When to use:**
- In `'use client'` components
- For OAuth sign-in (needs browser redirect)
- For real-time subscriptions
- For listening to auth state changes

---

### `/app/utils/supabase/server.ts` — Server Client

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { /* set cookies */ }
    }
  })
}
```

**When to use:**
- In Server Components
- In API routes (`app/api/**/route.ts`)
- Anywhere on the server that needs auth info

---

### `/app/providers/AuthProvider.tsx` — React Context

```typescript
'use client'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**What it does:**
1. Creates a React Context that holds user state
2. On mount, fetches the current session
3. Listens for auth changes (so UI updates when user logs in/out)
4. Provides `useAuth()` hook for components to access user

**Using in components:**
```typescript
'use client'
import { useAuth } from '@/app/providers/AuthProvider'

function MyComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      Welcome, {user?.email}
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

---

### `/app/login/login-form.tsx` — Login Component

```typescript
'use client'

export function LoginForm() {
  const supabase = createClient()  // Browser client for OAuth

  // Email/password login
  const handleEmailLogin = async (e) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (!error) {
      router.push('/')
      router.refresh()  // Important! Refreshes server components
    }
  }

  // OAuth login
  const handleOAuthLogin = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,  // 'google' or 'github'
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }
}
```

**Why `router.refresh()`?**

After login, the session cookie is set. But Server Components don't automatically re-render. `router.refresh()` tells Next.js to re-fetch all Server Components with the new cookies.

---

### `/app/auth/callback/route.ts` — OAuth Callback Handler

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

**OAuth flow:**
1. User clicks "Sign in with Google"
2. Browser redirects to Google's login page
3. User authorizes your app
4. Google redirects to `/auth/callback?code=XXXX`
5. This route exchanges the code for a session
6. Session is stored in cookies
7. User is redirected to the app

---

### API Routes — Data Protection

```typescript
// app/api/people/route.ts

export async function GET() {
  const supabase = await createClient()

  // 1. Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Query data filtered by user_id
  const { data } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', user.id)  // Only get this user's data

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Insert with user_id
  const { data } = await supabase
    .from('people')
    .insert({ ...body, user_id: user.id })  // Attach user ownership
    .select()
    .single()

  return NextResponse.json(data)
}
```

---

### Database RLS Policies — Defense in Depth

Even if someone bypasses your API, RLS policies protect the database:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view their own people"
ON public.people FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can only insert data with their own user_id
CREATE POLICY "Users can insert their own people"
ON public.people FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);
```

**How RLS works:**
1. `auth.uid()` returns the current user's ID from the JWT token
2. `USING` clause filters which rows can be read
3. `WITH CHECK` clause validates which rows can be written
4. `TO authenticated` means only logged-in users can access

---

## Authentication Flow

### Email/Password Login

```
1. User submits email + password
   ↓
2. supabase.auth.signInWithPassword()
   ↓
3. Supabase validates credentials
   ↓
4. Supabase returns JWT tokens
   ↓
5. @supabase/ssr stores tokens in cookies
   ↓
6. router.refresh() re-renders app with new session
   ↓
7. User sees authenticated UI
```

### OAuth Login (Google/GitHub)

```
1. User clicks "Sign in with Google"
   ↓
2. supabase.auth.signInWithOAuth({ provider: 'google' })
   ↓
3. Browser redirects to Google
   ↓
4. User logs in to Google
   ↓
5. Google redirects to /auth/callback?code=XXXX
   ↓
6. exchangeCodeForSession(code) exchanges code for tokens
   ↓
7. Tokens stored in cookies
   ↓
8. Redirect to home page
```

### Session Refresh (automatic)

```
1. User makes a request
   ↓
2. Middleware intercepts
   ↓
3. getUser() checks token validity
   ↓
4. If access token expired but refresh token valid:
   - Supabase automatically issues new access token
   - New tokens stored in cookies
   ↓
5. Request continues with valid session
```

---

## Setup Instructions

### 1. Run the Database Migration

Copy the contents of `supabase/migrations/001_add_auth_user_id_and_rls.sql` and run it in:
- Supabase Dashboard → SQL Editor → New Query → Paste → Run

### 2. Configure OAuth Providers (Supabase Dashboard)

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Set authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase: Authentication → Providers → Google → Enable → Paste credentials

**GitHub:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase: Authentication → Providers → GitHub → Enable → Paste credentials

### 3. Configure URL Settings (Supabase Dashboard)

Go to Authentication → URL Configuration:
- **Site URL:** `http://localhost:3000` (or your production URL)
- **Redirect URLs:** Add `http://localhost:3000/auth/callback`

### 4. Environment Variables

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## How to Test

### Test 1: Route Protection
1. Open an incognito window
2. Go to `http://localhost:3000/`
3. **Expected:** Redirected to `/login`

### Test 2: Email/Password Signup
1. Go to `/signup`
2. Enter email and password
3. **Expected:** "Check your email" message appears
4. Check email for confirmation link
5. Click link → redirected to app, logged in

### Test 3: Email/Password Login
1. Go to `/login`
2. Enter registered email/password
3. **Expected:** Redirected to home page, see your email in nav

### Test 4: OAuth Login
1. Go to `/login`
2. Click "Google" or "GitHub"
3. **Expected:** Redirected to provider, then back to app logged in

### Test 5: Data Isolation
1. Log in as User A, create a person
2. Log out, log in as User B
3. **Expected:** User B cannot see User A's person

### Test 6: Sign Out
1. Click sign out in navigation
2. **Expected:** Redirected to `/login`, cannot access protected pages

---

## Common Issues

### "Invalid Refresh Token"
The user's session expired completely. They need to log in again.

### OAuth redirect not working
Check that your redirect URL in Supabase matches exactly:
`http://localhost:3000/auth/callback` (no trailing slash!)

### "Unauthorized" errors in console
The middleware might be redirecting API calls. Check that API routes are not in the `publicRoutes` array in `middleware.ts`.

### User data not showing after login
Call `router.refresh()` after successful login to re-render Server Components.

---

## Summary

| Component | Purpose |
|-----------|---------|
| `middleware.ts` | Protects all routes, redirects unauthenticated users |
| `supabase/client.ts` | Browser client for OAuth and client components |
| `supabase/server.ts` | Server client for API routes and server components |
| `supabase/middleware.ts` | Session validation and refresh in middleware |
| `AuthProvider.tsx` | React context for user state in client components |
| `login-form.tsx` | Login UI with email/password and OAuth buttons |
| `auth/callback/route.ts` | Handles OAuth redirects |
| API routes | Check auth + filter data by user_id |
| RLS policies | Database-level security, enforces user_id matching |

The key insight: **Authentication is layered**. Middleware protects routes, API routes check sessions, and RLS policies protect the database. Each layer backs up the others.
