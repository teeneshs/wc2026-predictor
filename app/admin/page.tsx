'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ScoringRules {
  id?: number
  exact_score_points: number
  correct_result_points: number
  wrong_prediction_points: number
}

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [scoringRules, setScoringRules] = useState<ScoringRules>({
    exact_score_points: 3,
    correct_result_points: 1,
    wrong_prediction_points: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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
      router.push('/fixtures')
      return
    }

    setProfile(data)

    // TEMPORARILY DISABLED: Check if user is admin
    // if (!data.is_admin) {
    //   router.push('/fixtures')
    //   return
    // }

    // Fetch scoring rules
    await fetchScoringRules()
  }

  const fetchScoringRules = async () => {
    const { data, error } = await supabase
      .from('scoring_rules')
      .select('*')
      .single()

    if (error) {
      // If no rules exist, use defaults
      console.log('No scoring rules found, using defaults')
    } else {
      setScoringRules(data)
    }
  }

  const handleRecalculatePoints = async () => {
    setSaving(true)
    setMessage('Recalculating points for all predictions...')

    // Fetch all matches from API
    const res = await fetch('/api/fixtures')
    const fixtures = await res.json()

    // Filter finished matches
    const finishedFixtures = fixtures.filter((match: any) => match.status === 'FINISHED')

    // For each finished match, update predictions with new points
    for (const match of finishedFixtures) {
      const { data: predictions, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', match.id)

      if (predError) continue

      for (const pred of predictions) {
        let points = scoringRules.wrong_prediction_points

        if (pred.home_score === match.score.fullTime.home && pred.away_score === match.score.fullTime.away) {
          points = scoringRules.exact_score_points
        } else if (
          (pred.home_score > pred.away_score && match.score.fullTime.home > match.score.fullTime.away) ||
          (pred.home_score < pred.away_score && match.score.fullTime.home < match.score.fullTime.away) ||
          (pred.home_score === pred.away_score && match.score.fullTime.home === match.score.fullTime.away)
        ) {
          points = scoringRules.correct_result_points
        }

        await supabase
          .from('predictions')
          .update({ points })
          .eq('id', pred.id)
      }
    }

    setMessage('All prediction points have been recalculated!')
    setTimeout(() => setMessage(''), 5000)
    setSaving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('Saving scoring rules...')

    try {
      const { error } = await supabase
        .from('scoring_rules')
        .upsert(scoringRules)

      if (error) {
        setMessage(`Error saving scoring rules: ${error.message}`)
      } else {
        setMessage('Scoring rules saved successfully!')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (err: any) {
      if (err.message && err.message.includes("Could not find the table")) {
        setMessage('Scoring rules table does not exist. Please create the table in Supabase with columns: id (serial primary key), exact_score_points (int), correct_result_points (int), wrong_prediction_points (int).')
      } else {
        setMessage(`Unexpected error: ${err.message}`)
      }
    }
    setSaving(false)
  }

  const handleInputChange = (field: keyof ScoringRules, value: string) => {
    const numValue = parseInt(value) || 0
    setScoringRules(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-red-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">🔧</div>
          <p className="text-2xl font-bold">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-red-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <nav className="relative z-10 border-b border-white/10 backdrop-blur-lg bg-black/20 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link href="/fixtures" className="text-3xl font-black bg-gradient-to-r from-red-400 via-white to-red-400 bg-clip-text text-transparent">
            ⚽ FIFA WC 2026
          </Link>
          <div className="flex gap-6 text-lg">
            <Link href="/fixtures" className="text-white/70 hover:text-white">Fixtures</Link>
            <Link href="/leaderboard" className="text-white/70 hover:text-white">Leaderboard</Link>
            <Link href="/profile" className="text-white/70 hover:text-white">Profile</Link>
            <span className="text-red-300 font-bold">Admin</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-red-400 via-white to-red-400 bg-clip-text text-transparent">
          🔧 Admin Panel
        </h1>
        <p className="text-gray-200 mb-8 text-xl">Manage scoring rules and system settings</p>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl border ${
            message.includes('Error') 
              ? 'bg-red-500/20 border-red-400 text-red-200' 
              : 'bg-green-500/20 border-green-400 text-green-200'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white/10 rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-black mb-6 text-red-300">🎯 Prediction Scoring Rules</h2>
          <p className="text-gray-300 mb-6">Configure how points are awarded for different prediction outcomes.</p>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-lg font-bold mb-3 text-green-300">
                  🏆 Exact Score
                </label>
                <p className="text-sm text-gray-400 mb-4">Points for predicting the exact final score</p>
                <input
                  type="number"
                  min="0"
                  value={scoringRules.exact_score_points}
                  onChange={(e) => handleInputChange('exact_score_points', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-400/20"
                />
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-lg font-bold mb-3 text-yellow-300">
                  👍 Correct Result
                </label>
                <p className="text-sm text-gray-400 mb-4">Points for predicting the correct winner/draw</p>
                <input
                  type="number"
                  min="0"
                  value={scoringRules.correct_result_points}
                  onChange={(e) => handleInputChange('correct_result_points', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
                />
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-lg font-bold mb-3 text-red-300">
                  ❌ Wrong Prediction
                </label>
                <p className="text-sm text-gray-400 mb-4">Points for incorrect predictions</p>
                <input
                  type="number"
                  min="0"
                  value={scoringRules.wrong_prediction_points}
                  onChange={(e) => handleInputChange('wrong_prediction_points', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-400/20"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold mb-4 text-blue-300">📊 Scoring Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-green-500/20 rounded-xl p-4">
                  <p className="text-2xl font-black text-green-300">{scoringRules.exact_score_points}</p>
                  <p className="text-sm text-gray-300">Exact Score</p>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-4">
                  <p className="text-2xl font-black text-yellow-300">{scoringRules.correct_result_points}</p>
                  <p className="text-sm text-gray-300">Correct Result</p>
                </div>
                <div className="bg-red-500/20 rounded-xl p-4">
                  <p className="text-2xl font-black text-red-300">{scoringRules.wrong_prediction_points}</p>
                  <p className="text-sm text-gray-300">Wrong Prediction</p>
                </div>
              </div>
            </div>

            {/* Admin Setup Section */}
            <div className="mt-8 p-6 bg-yellow-500/10 rounded-2xl border border-yellow-400/30">
              <h3 className="text-xl font-black mb-4 text-yellow-300">⚙️ Admin Setup</h3>
              <p className="text-gray-300 mb-4">Make yourself an admin to access this page permanently.</p>
              <button
                onClick={async () => {
                  if (!user) return;
                  const { error } = await supabase
                    .from('profiles')
                    .update({ is_admin: true })
                    .eq('id', user.id);

                  if (error) {
                    setMessage('Error: Could not make you admin - ' + error.message);
                  } else {
                    setMessage('✅ You are now an admin! The admin link will appear in navigation.');
                    // Refresh profile
                    await fetchProfile(user.id);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Make Me Admin
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-8 py-4 rounded-2xl font-black text-xl transition-all duration-300 ${
                  saving
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:via-red-400 hover:to-red-500 text-white shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 border-2 border-red-400 hover:border-red-300'
                }`}
              >
                {saving ? '💾 Saving...' : '💾 Save Scoring Rules'}
              </button>
              <button
                onClick={handleRecalculatePoints}
                disabled={saving}
                className={`px-8 py-4 rounded-2xl font-black text-xl transition-all duration-300 ${
                  saving
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:via-orange-400 hover:to-orange-500 text-white shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 border-2 border-orange-400 hover:border-orange-300'
                }`}
              >
                {saving ? '🔄 Recalculating...' : '🔄 Recalculate All Points'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white/10 rounded-3xl p-6 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-black mb-4 text-orange-300">📋 Admin Notes</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• Changes to scoring rules will affect future predictions only</li>
            <li>• Existing predictions will keep their original point values</li>
            <li>• Make sure to test the new rules before applying them</li>
            <li>• Consider announcing rule changes to users</li>
          </ul>
        </div>
      </div>
    </main>
  )
}