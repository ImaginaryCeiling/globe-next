import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Globe',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white text-3xl font-bold flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Globe
          </h1>
          <p className="text-zinc-400 mt-2">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="text-zinc-500 text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
