import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  // Check if user selected "remember me"
  const rememberMe = cookieStore.get('remember_me')?.value === 'true'
  
  const cookieOptions = {
    // 30 days if remember me, otherwise session cookie (no maxAge)
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 14 } : {}),
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...cookieOptions,
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}