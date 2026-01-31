'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/app/utils/supabase/client'

// Helper to set the remember_me cookie
function setRememberMeCookie(remember: boolean) {
  if (remember) {
    // Set cookie for 30 days
    document.cookie = `remember_me=true; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  } else {
    // Delete the cookie
    document.cookie = 'remember_me=; path=/; max-age=0'
  }
}

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Set remember_me cookie before auth
    setRememberMeCookie(rememberMe)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    // Set remember_me cookie before OAuth redirect
    setRememberMeCookie(rememberMe)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  if (success) {
    return (
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-4">
            We&apos;ve sent a confirmation link to <span className="text-white">{email}</span>
          </p>
          <p className="text-zinc-500 text-xs">
            Click the link in the email to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your password"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
          />
          <label htmlFor="remember-me" className="text-sm text-zinc-400">
            Remember me for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-zinc-900 text-zinc-400">Or continue with</span>
        </div>
      </div>

      <button
        onClick={() => handleOAuthLogin('google')}
        type="button"
        className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors border border-zinc-700"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </button>

      <p className="text-center text-zinc-400 mt-6 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-500 hover:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  )
}
