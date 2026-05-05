'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LeaderboardEntry {
  user_id: string
  username: string
  total_points: number
  predictions_count: number
}

export default function Leaderboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
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
      await fetchLeaderboard()
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

  const fetchLeaderboard = async () => {
    // Fetch all predictions
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('user_id, points')

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return
    }

    // Get unique user IDs
    const userIds = [...new Set(predictions.map(p => p.user_id))]

    // Fetch profiles for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
      return
    }

    // Create a map of user_id to username
    const profileMap: { [key: string]: string } = {}
    profiles.forEach(profile => {
      profileMap[profile.id] = profile.username || 'Anonymous'
    })

    // Group by user and calculate totals
    const userStats: { [key: string]: LeaderboardEntry } = {}

    predictions.forEach((prediction: any) => {
      const userId = prediction.user_id
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          username: profileMap[userId] || 'Anonymous',
          total_points: 0,
          predictions_count: 0
        }
      }
      userStats[userId].total_points += prediction.points || 0
      userStats[userId].predictions_count += 1
    })

    // Convert to array and sort by total points descending
    const sortedLeaderboard = Object.values(userStats).sort(
      (a, b) => b.total_points - a.total_points
    )

    setLeaderboard(sortedLeaderboard)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">🏆</div>
          <p className="text-2xl font-bold">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <nav className="relative z-10 border-b border-white/10 backdrop-blur-lg bg-black/20 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link href="/fixtures" className="text-3xl font-black bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            ⚽ FIFA WC 2026
          </Link>
          <div className="flex gap-6 text-lg">
            <Link href="/fixtures" className="text-white/70 hover:text-white">Fixtures</Link>
            <Link href="/leaderboard" className="text-blue-300 hover:text-white">Leaderboard</Link>
            <Link href="/profile" className="text-white/70 hover:text-white">Profile</Link>
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
        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
          🏆 Global Leaderboard
        </h1>
        <p className="text-gray-200 mb-8 text-xl">See how you rank against other World Cup predictors! 🌍⚽</p>

        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-200 py-20 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-9xl mb-6 animate-bounce">📊</div>
            <p className="text-3xl font-bold mb-4">No predictions yet</p>
            <p className="text-xl text-gray-300 max-w-md mx-auto">Be the first to make predictions and claim the top spot! ⚽🏆</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`bg-white/10 rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-blue-500/20 transition-transform duration-300 hover:scale-105 ${
                  entry.user_id === user.id ? 'ring-2 ring-blue-400 bg-blue-500/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`text-4xl font-black w-16 h-16 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-500 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-600 text-orange-100' :
                      'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-2xl font-black">{entry.username}</p>
                      <p className="text-gray-300">{entry.predictions_count} predictions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-green-300">{entry.total_points}</p>
                    <p className="text-sm text-gray-300">points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}