'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserPrediction {
  id: number
  match_id: number
  home_score: number
  away_score: number
  points: number
  created_at: string
  match?: any
}

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<UserPrediction[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchProfile(user.id)
      await fetchPredictions(user.id)
      await fetchFixtures()
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setProfile(data)
    }
  }

  const fetchPredictions = async (userId: string) => {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching predictions:', error)
    } else {
      setPredictions(data || [])
    }
  }

  const fetchFixtures = async () => {
    const res = await fetch('/api/fixtures')
    const data = await res.json()
    setFixtures(data)
  }

  const getMatchDetails = (matchId: number) => {
    return fixtures.find(f => f.id === matchId)
  }

  const getTotalPoints = () => {
    return predictions.reduce((sum, p) => sum + (p.points || 0), 0)
  }

  const getAccuracy = () => {
    const completed = predictions.filter(p => p.points !== null && p.points !== undefined)
    if (completed.length === 0) return 0
    const correct = completed.filter(p => p.points > 0).length
    return Math.round((correct / completed.length) * 100)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">👤</div>
          <p className="text-2xl font-bold">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <nav className="relative z-10 border-b border-white/10 backdrop-blur-lg bg-black/20 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link href="/fixtures" className="text-3xl font-black bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            ⚽ FIFA WC 2026
          </Link>
          <div className="flex gap-6 text-lg">
            <Link href="/fixtures" className="text-white/70 hover:text-white">Fixtures</Link>
            <Link href="/leaderboard" className="text-white/70 hover:text-white">Leaderboard</Link>
            <Link href="/profile" className="text-blue-300 hover:text-white">Profile</Link>
            {profile?.is_admin && (
              <Link href="/admin" className="text-red-300 hover:text-white font-bold">Admin</Link>
            )}
            {!profile?.is_admin && (
              <Link href="/admin" className="text-yellow-300 hover:text-white font-bold animate-pulse">Setup Admin</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
              👤 {profile?.username || user?.email}
            </h1>
            <p className="text-gray-200 text-xl">Your World Cup prediction dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-black text-blue-300">{getTotalPoints()}</div>
              <div className="text-sm text-gray-300">Total Points</div>
            </div>
          </div>
          <div className="bg-white/10 rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-3xl font-black text-green-300">{predictions.length}</div>
              <div className="text-sm text-gray-300">Predictions Made</div>
            </div>
          </div>
          <div className="bg-white/10 rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-black text-yellow-300">{getAccuracy()}%</div>
              <div className="text-sm text-gray-300">Prediction Accuracy</div>
            </div>
          </div>
        </div>

        {/* Predictions History */}
        <div className="bg-white/10 rounded-3xl p-6 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-black mb-6 text-blue-300">📋 Your Predictions</h2>

          {predictions.length === 0 ? (
            <div className="text-center text-gray-200 py-10">
              <div className="text-6xl mb-4">⚽</div>
              <p className="text-xl font-bold mb-2">No predictions yet</p>
              <p className="text-gray-300">Start making predictions on the fixtures page!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction) => {
                const match = getMatchDetails(prediction.match_id)
                return (
                  <div key={prediction.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-300">
                          {match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : `Match ${prediction.match_id}`}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full font-semibold ${
                          prediction.points === 3 ? 'bg-green-600 text-green-100' :
                          prediction.points === 1 ? 'bg-yellow-600 text-yellow-100' :
                          'bg-red-600 text-red-100'
                        }`}>
                          {prediction.points === 3 ? '🎯 +3 Exact!' :
                           prediction.points === 1 ? '👍 +1 Correct' :
                           '❌ +0'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(prediction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-lg font-bold">
                      Your prediction: {prediction.home_score} – {prediction.away_score}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}