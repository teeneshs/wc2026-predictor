'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is in recovery mode
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setMessage('Invalid or expired reset link. Please request a new one.')
      }
    }
    checkSession()
  }, [])

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setMessage('Passwords do not match!')
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long!')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password reset successfully! Redirecting to login...')
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-bounce"></div>
      </div>
      
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 text-8xl animate-spin-slow">⚽</div>
        <div className="absolute bottom-10 left-10 text-6xl animate-pulse">🏆</div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce drop-shadow-2xl">🔑</div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent drop-shadow-lg">Create New Password</h1>
          <p className="text-gray-200 mt-2 text-xl font-medium">Enter your new password below</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl glow-card">
          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-2 font-bold">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={success}
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all duration-300 text-lg backdrop-blur-sm pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={success}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-200 mb-2 font-bold">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={success}
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all duration-300 text-lg backdrop-blur-sm pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={success}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-2xl text-sm text-center backdrop-blur-sm shadow-lg border-2 ${
              success
                ? 'bg-green-900/50 border-green-500/50 text-green-200' 
                : 'bg-red-900/50 border-red-500/50 text-red-200'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading || success || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-2xl font-black text-xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed border-2 border-blue-400 hover:border-blue-300 glow-blue">
            {loading ? '⚽ Resetting password...' : '✅ RESET PASSWORD'}
          </button>

          <p className="text-center text-gray-300 text-lg mt-6">
            <Link href="/login" className="text-blue-300 hover:text-blue-200 font-bold hover:underline transition-colors text-xl">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
