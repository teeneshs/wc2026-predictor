'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Fixtures() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fixtures, setFixtures] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any>({})
  const [saved, setSaved] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'groups' | 'dates'>('all')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
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
      await fetchFixtures()
      await fetchPredictions(user.id)
      setLoading(false)
    }
    getUser()

    // World Cup 2026 countdown (assuming June 11, 2026 opening match)
    const worldCupDate = new Date('2026-06-11T00:00:00')
    const updateCountdown = () => {
      const now = new Date()
      const diff = worldCupDate.getTime() - now.getTime()
      
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        })
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
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

    const fetchFixtures = async () => {
    const res = await fetch('/api/fixtures')
    const data = await res.json()
    setFixtures(data)
    }

  const fetchPredictions = async (userId: string) => {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)

    const map: any = {}
    data?.forEach((p: any) => {
      map[p.match_id] = p
    })
    setPredictions(map)
  }

  const handleSave = async (matchId: number) => {
    const pred = predictions[matchId]
    if (pred?.home_score === undefined || pred?.away_score === undefined) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = await supabase
      .from('predictions')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single()

    if (existing.data) {
      await supabase
        .from('predictions')
        .update({
          home_score: pred.home_score,
          away_score: pred.away_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.data.id)
    } else {
      await supabase
        .from('predictions')
        .insert({
          user_id: user.id,
          match_id: matchId,
          home_score: pred.home_score,
          away_score: pred.away_score,
        })
    }

    setSaved((prev: any) => ({ ...prev, [matchId]: true }))
    setTimeout(() => setSaved((prev: any) => ({ ...prev, [matchId]: false })), 2000)
  }

  const getStatus = (match: any) => {
    if (match.status === 'FINISHED') return { label: 'Finished', color: 'text-green-400 bg-green-900' }
    if (match.status === 'IN_PLAY' || match.status === 'PAUSED') return { label: 'Live', color: 'text-red-400 bg-red-900' }
    return { label: 'Upcoming', color: 'text-gray-400 bg-gray-800' }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  const getFlagEmoji = (tla: string) => {
    // Mapping of team codes to country codes for flag images
    const countryCodes: { [key: string]: string } = {
      'BRA': 'BR', 'ARG': 'AR', 'FRA': 'FR', 'GER': 'DE', 'ESP': 'ES', 'ENG': 'GB',
      'ITA': 'IT', 'NED': 'NL', 'POR': 'PT', 'URU': 'UY', 'MEX': 'MX', 'USA': 'US',
      'JPN': 'JP', 'KOR': 'KR', 'AUS': 'AU', 'QAT': 'QA', 'MAR': 'MA', 'SEN': 'SN',
      'BEL': 'BE', 'CRO': 'HR', 'DEN': 'DK', 'SUI': 'CH', 'NIR': 'GB-NIR', 'IRL': 'IE',
      'POL': 'PL', 'UKR': 'UA', 'TUR': 'TR', 'AUT': 'AT', 'HUN': 'HU', 'CZE': 'CZ',
      'SVK': 'SK', 'SWE': 'SE', 'NOR': 'NO', 'FIN': 'FI', 'ISL': 'IS', 'WAL': 'GB-WLS',
      'SCO': 'GB-SCT', 'GRE': 'GR', 'SRB': 'RS', 'ROU': 'RO', 'BUL': 'BG', 'RUS': 'RU',
      // Additional 2026 World Cup countries
      'RSA': 'ZA', 'ZAF': 'ZA', // South Africa
      'CAN': 'CA', // Canada
      'PAR': 'PY', // Paraguay
      'BIH': 'BA', // Bosnia and Herzegovina
      'ALG': 'DZ', // Algeria
      'ANG': 'AO', // Angola
      'BOL': 'BO', // Bolivia
      'BOT': 'BW', // Botswana
      'BUR': 'BI', // Burundi
      'CPV': 'CV', // Cape Verde
      'CHA': 'TD', // Chad
      'CHI': 'CL', // Chile
      'COL': 'CO', // Colombia
      'COM': 'KM', // Comoros
      'CRC': 'CR', // Costa Rica
      'CIV': 'CI', // Ivory Coast
      'ECU': 'EC', // Ecuador
      'EGY': 'EG', // Egypt
      'SLV': 'SV', // El Salvador
      'EQG': 'GQ', // Equatorial Guinea
      'ETH': 'ET', // Ethiopia
      'GAB': 'GA', // Gabon
      'GAM': 'GM', // Gambia
      'GHA': 'GH', // Ghana
      'GUI': 'GN', // Guinea
      'GNB': 'GW', // Guinea-Bissau
      'HAI': 'HT', // Haiti
      'HON': 'HN', // Honduras
      'IDN': 'ID', // Indonesia
      'IRN': 'IR', // Iran
      'IRQ': 'IQ', // Iraq
      'ISR': 'IL', // Israel
      'JAM': 'JM', // Jamaica
      'JOR': 'JO', // Jordan
      'KEN': 'KE', // Kenya
      'KUW': 'KW', // Kuwait
      'LIB': 'LR', // Liberia
      'LBY': 'LY', // Libya
      'MAD': 'MG', // Madagascar
      'MWI': 'MW', // Malawi
      'MLI': 'ML', // Mali
      'MTN': 'MR', // Mauritania
      'MRI': 'MU', // Mauritius
      'MAU': 'MA', // Morocco (already have MAR)
      'MOZ': 'MZ', // Mozambique
      'NAM': 'NA', // Namibia
      'NGA': 'NG', // Nigeria
      'NCL': 'NC', // New Caledonia
      'NZL': 'NZ', // New Zealand
      'NIC': 'NI', // Nicaragua
      'NIG': 'NE', // Niger
      'OMA': 'OM', // Oman
      'PAN': 'PA', // Panama
      'PNG': 'PG', // Papua New Guinea
      'PER': 'PE', // Peru
      'PHI': 'PH', // Philippines
      'PLE': 'PS', // Palestine
      'RWA': 'RW', // Rwanda
      'SAU': 'SA', // Saudi Arabia
      'SLE': 'SL', // Sierra Leone
      'SIN': 'SG', // Singapore
      'SOL': 'SO', // Somalia
      'SSD': 'SS', // South Sudan
      'SRI': 'LK', // Sri Lanka
      'SDN': 'SD', // Sudan
      'SUR': 'SR', // Suriname
      'SWZ': 'SZ', // Eswatini
      'SYR': 'SY', // Syria
      'TAH': 'PF', // Tahiti
      'TAJ': 'TJ', // Tajikistan
      'TAN': 'TZ', // Tanzania
      'THA': 'TH', // Thailand
      'TOG': 'TG', // Togo
      'TUN': 'TN', // Tunisia
      'UGA': 'UG', // Uganda
      'UAE': 'AE', // United Arab Emirates
      'UZB': 'UZ', // Uzbekistan
      'VEN': 'VE', // Venezuela
      'VIE': 'VN', // Vietnam
      'ZAM': 'ZM', // Zambia
      'ZIM': 'ZW', // Zimbabwe
    }
    
    const countryCode = countryCodes[tla]
    if (countryCode) {
      return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
    }
    return '🏴' // fallback emoji
  }

  const FlagImage = ({ tla, className = "w-8 h-6 rounded-sm border border-white/20" }: { tla: string, className?: string }) => {
    const flagSrc = getFlagEmoji(tla)
    if (flagSrc.startsWith('http')) {
      return <img src={flagSrc} alt={`${tla} flag`} className={className} />
    }
    return <span className="text-2xl">{flagSrc}</span>
  }

  const groupFixturesByDate = () => {
    const grouped: { [key: string]: any[] } = {}
    fixtures.forEach(match => {
      const date = new Date(match.utcDate).toDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(match)
    })
    return grouped
  }

  const groupFixturesByGroup = () => {
    const grouped: { [key: string]: any[] } = {}
    fixtures.forEach(match => {
      const group = match.group || 'Group Stage'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push(match)
    })
    return grouped
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl animate-spin-slow">⚽</div>
      </div>
      <div className="relative z-10 text-center">
        <div className="text-7xl mb-6 animate-bounce drop-shadow-2xl">⚽</div>
        <p className="text-gray-200 text-2xl font-bold">Loading FIFA World Cup fixtures...</p>
        <p className="text-gray-400 text-lg mt-4">Get ready for the ultimate prediction experience! 🌍</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white relative">
      {/* Enhanced animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-yellow-400/5 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-green-400/5 rounded-full blur-2xl animate-bounce delay-700"></div>
      </div>
      
      {/* Enhanced background pattern with more elements */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 text-9xl animate-spin-slow">⚽</div>
        <div className="absolute bottom-20 right-10 text-7xl animate-pulse">🏆</div>
        <div className="absolute top-1/4 right-1/5 text-6xl animate-spin-slow delay-1000">⭐</div>
        <div className="absolute bottom-1/4 left-1/6 text-8xl animate-bounce delay-500">🌍</div>
        <div className="absolute top-3/4 left-2/3 text-5xl animate-pulse delay-1500">⚡</div>
      </div>
      
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-lg bg-black/20 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link href="/fixtures" className="text-3xl font-black bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent hover:scale-105 transition-transform drop-shadow-lg">
            ⚽ FIFA WC 2026
          </Link>
          <div className="flex gap-8 text-lg">
            <Link href="/fixtures" className="text-blue-300 font-bold hover:text-blue-200 transition-colors">Fixtures</Link>
            <Link href="/leaderboard" className="text-white/70 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/profile" className="text-white/70 hover:text-white transition-colors">Profile</Link>
            {profile?.is_admin && (
              <Link href="/admin" className="text-red-300 hover:text-white font-bold transition-colors">Admin</Link>
            )}
            {/* TEMPORARILY SHOW ADMIN LINK UNTIL USER MAKES THEMSELVES ADMIN */}
            {!profile?.is_admin && (
              <Link href="/admin" className="text-yellow-300 hover:text-white font-bold transition-colors animate-pulse">Setup Admin</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent drop-shadow-lg">Group Stage Fixtures</h1>
        <p className="text-gray-200 mb-8 text-xl font-medium">Make your predictions and climb the global rankings! 🌍⚽</p>

        {/* World Cup Countdown */}
        {countdown && countdown.days > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-600/20 via-white/10 to-red-600/20 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-yellow-300 mb-2">⏰ World Cup 2026 Countdown</h2>
              <p className="text-gray-300">The most exciting tournament is coming!</p>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-3xl font-black text-blue-300">{countdown.days}</div>
                <div className="text-sm text-gray-300">Days</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-3xl font-black text-red-300">{countdown.hours}</div>
                <div className="text-sm text-gray-300">Hours</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-3xl font-black text-yellow-300">{countdown.minutes}</div>
                <div className="text-sm text-gray-300">Minutes</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-3xl font-black text-green-300">{countdown.seconds}</div>
                <div className="text-sm text-gray-300">Seconds</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-8 p-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 sm:px-6 py-3 rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 flex-1 sm:flex-none ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-lg glow-blue'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            📋 All Fixtures
          </button>
          <button
            onClick={() => setFilterType('dates')}
            className={`px-4 sm:px-6 py-3 rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 flex-1 sm:flex-none ${
              filterType === 'dates'
                ? 'bg-blue-600 text-white shadow-lg glow-blue'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            📅 By Date
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-4 sm:px-6 py-3 rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 flex-1 sm:flex-none ${
              filterType === 'groups'
                ? 'bg-blue-600 text-white shadow-lg glow-blue'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            🏆 By Groups
          </button>
        </div>

        {/* User Prediction Stats */}
        <div className="mb-8 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-purple-300 mb-2">📊 Your Prediction Stats</h2>
            <p className="text-gray-300">Track your World Cup expertise!</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-black text-purple-300">{Object.keys(predictions).length}</div>
              <div className="text-sm text-gray-300">Predictions Made</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-black text-pink-300">{fixtures.filter(m => m.status === 'FINISHED').length}</div>
              <div className="text-sm text-gray-300">Matches Completed</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-black text-red-300">{fixtures.filter(m => m.status === 'SCHEDULED').length}</div>
              <div className="text-sm text-gray-300">Matches Remaining</div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-blue-500/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <div className="text-3xl md:text-4xl mb-2">🌍</div>
              <div className="text-xl md:text-2xl font-black text-blue-300">48</div>
              <div className="text-xs md:text-sm text-gray-300">Teams</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-red-500/20 hover:border-red-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <div className="text-3xl md:text-4xl mb-2">🏟️</div>
              <div className="text-xl md:text-2xl font-black text-red-300">16</div>
              <div className="text-xs md:text-sm text-gray-300">Stadiums</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-yellow-500/20 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <div className="text-3xl md:text-4xl mb-2">⚽</div>
              <div className="text-xl md:text-2xl font-black text-yellow-300">104</div>
              <div className="text-xs md:text-sm text-gray-300">Matches</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl hover:shadow-green-500/20 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <div className="text-3xl md:text-4xl mb-2">🏆</div>
              <div className="text-xl md:text-2xl font-black text-green-300">1</div>
              <div className="text-xs md:text-sm text-gray-300">Champion</div>
            </div>
          </div>
        </div>

        {fixtures.length === 0 && (
          <div className="text-center text-gray-200 py-20 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl glow-card">
            <div className="text-9xl mb-6 animate-bounce drop-shadow-2xl">📅</div>
            <p className="text-3xl font-bold mb-4">No fixtures available yet</p>
            <p className="text-xl text-gray-300 max-w-md mx-auto">The FIFA World Cup 2026 fixtures will be announced soon. Get ready for the most exciting tournament in football history! Stay tuned for updates. ⚽🏆</p>
          </div>
        )}

        {filterType === 'all' && fixtures.length > 0 && (
          <div className="space-y-6">
            {fixtures.map((match: any) => {
              const status = getStatus(match)
              const isFinished = match.status === 'FINISHED'
              const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
              const pred = predictions[match.id] || {}

              return (
                <div key={match.id} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/50 transition-all duration-500 hover:scale-[1.02] glow-card">
                  <div className="flex justify-between items-center mb-6">
                    <span className={`text-sm px-4 py-2 rounded-full font-black shadow-lg ${
                      status.label === 'Finished' ? 'bg-green-600 text-green-100 border-2 border-green-400' :
                      status.label === 'Live' ? 'bg-red-600 text-red-100 border-2 border-red-400 animate-pulse' :
                      'bg-blue-600 text-blue-100 border-2 border-blue-400'
                    }`}>
                      {status.label}
                    </span>
                    <span className="text-sm text-gray-200 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">{formatDate(match.utcDate)}</span>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-6 mb-6">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <FlagImage tla={match.homeTeam.tla} className="w-10 h-7 rounded border-2 border-white/30 shadow-lg" />
                        <p className="font-black text-xl text-white">{match.homeTeam.name}</p>
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-r from-blue-600/20 via-white/10 to-red-600/20 rounded-2xl py-4 px-6 shadow-inner border border-white/20 backdrop-blur-sm">
                      {isFinished || isLive ? (
                        <p className="text-3xl font-black text-white drop-shadow-lg">
                          {match.score.fullTime.home ?? 0} – {match.score.fullTime.away ?? 0}
                        </p>
                      ) : (
                        <p className="text-gray-300 text-xl font-bold">VS</p>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <FlagImage tla={match.awayTeam.tla} className="w-10 h-7 rounded border-2 border-white/30 shadow-lg" />
                        <p className="font-black text-xl text-white">{match.awayTeam.name}</p>
                      </div>
                    </div>
                  </div>

                  {!isFinished && !isLive && (
                    <div className="bg-black/20 rounded-2xl p-6 mb-6 backdrop-blur-sm border border-white/10">
                      <p className="text-xl text-gray-200 text-center mb-4 font-bold">🎯 Your Prediction</p>
                      <div className="grid grid-cols-3 items-center gap-4 mb-6">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={pred.home_score ?? ''}
                          onChange={(e) => setPredictions((prev: any) => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], home_score: parseInt(e.target.value) }
                          }))}
                          className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all duration-300 text-xl font-bold backdrop-blur-sm"
                          placeholder="0"
                        />
                        <p className="text-center text-gray-300 font-black text-2xl">–</p>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={pred.away_score ?? ''}
                          onChange={(e) => setPredictions((prev: any) => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], away_score: parseInt(e.target.value) }
                          }))}
                          className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all duration-300 text-xl font-bold backdrop-blur-sm"
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => handleSave(match.id)}
                        className={`w-full py-4 rounded-2xl text-lg font-black transition-all duration-300 ${
                          saved[match.id]
                            ? 'bg-green-600 text-green-100 shadow-lg animate-pulse border-2 border-green-400'
                            : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 text-white shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 border-2 border-blue-400 hover:border-blue-300'
                        }`}>
                        {saved[match.id] ? '✅ Prediction Saved!' : '💾 Save Prediction'}
                      </button>
                    </div>
                  )}

                  {(isFinished || isLive) && predictions[match.id] && (
                    <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-center bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                      <span className="text-lg text-gray-200 font-medium">
                        Your prediction: <span className="font-black text-white text-xl">{pred.home_score} – {pred.away_score}</span>
                      </span>
                      <span className={`text-lg px-4 py-2 rounded-full font-black shadow-lg ${
                        pred.points === 3 ? 'bg-green-600 text-green-100 border-2 border-green-400' :
                        pred.points === 1 ? 'bg-yellow-600 text-yellow-100 border-2 border-yellow-400' :
                        'bg-red-600 text-red-100 border-2 border-red-400'
                      }`}>
                        {pred.points === 3 ? '🎯 +3 Exact!' : pred.points === 1 ? '👍 +1 Correct' : '❌ +0'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {filterType === 'dates' && fixtures.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupFixturesByDate()).map(([date, matches]) => (
              <div key={date} className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <h3 className="text-2xl font-black mb-6 text-blue-300 border-b border-white/20 pb-3">
                  📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <div className="space-y-6">
                  {matches.map((match: any) => {
                    const status = getStatus(match)
                    const isFinished = match.status === 'FINISHED'
                    const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
                    const pred = predictions[match.id] || {}

                    return (
                      <div key={match.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-blue-500/30 hover:border-blue-400/60 transition-all duration-500 hover:scale-105">
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-sm px-3 py-1 rounded-full font-bold transition-all duration-300 ${
                            status.label === 'Finished' ? 'bg-green-600 text-green-100 shadow-green-500/50' :
                            status.label === 'Live' ? 'bg-red-600 text-red-100 animate-pulse shadow-red-500/50' :
                            'bg-blue-600 text-blue-100 shadow-blue-500/50'
                          }`}>
                            {status.label}
                          </span>
                          <span className="text-sm text-gray-300 transition-colors duration-300">{formatDate(match.utcDate)}</span>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4 mb-4">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <FlagImage tla={match.homeTeam.tla} className="w-8 h-6 rounded border border-white/20" />
                              <p className="font-bold text-lg">{match.homeTeam.name}</p>
                            </div>
                          </div>
                          <div className="text-center bg-gradient-to-r from-blue-600/20 via-white/10 to-red-600/20 rounded-xl py-2 px-4">
                            {isFinished || isLive ? (
                              <p className="text-xl font-bold">
                                {match.score.fullTime.home ?? 0} – {match.score.fullTime.away ?? 0}
                              </p>
                            ) : (
                              <p className="text-gray-400">VS</p>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <FlagImage tla={match.awayTeam.tla} className="w-8 h-6 rounded border border-white/20" />
                              <p className="font-bold text-lg">{match.awayTeam.name}</p>
                            </div>
                          </div>
                        </div>

                        {!isFinished && !isLive && (
                          <div className="bg-black/20 rounded-xl p-4">
                            <div className="grid grid-cols-3 items-center gap-2 mb-3">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={pred.home_score ?? ''}
                                onChange={(e) => setPredictions((prev: any) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], home_score: parseInt(e.target.value) }
                                }))}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
                                placeholder="0"
                              />
                              <p className="text-center text-gray-400">–</p>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={pred.away_score ?? ''}
                                onChange={(e) => setPredictions((prev: any) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], away_score: parseInt(e.target.value) }
                                }))}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
                                placeholder="0"
                              />
                            </div>
                            <button
                              onClick={() => handleSave(match.id)}
                              className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                                saved[match.id]
                                  ? 'bg-green-600 text-green-100'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}>
                              {saved[match.id] ? '✅ Saved!' : '💾 Save'}
                            </button>
                          </div>
                        )}

                        {(isFinished || isLive) && predictions[match.id] && (
                          <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center">
                            <span className="text-sm text-gray-300">
                              Your prediction: {pred.home_score} – {pred.away_score}
                            </span>
                            <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                              pred.points === 3 ? 'bg-green-600 text-green-100' :
                              pred.points === 1 ? 'bg-yellow-600 text-yellow-100' :
                              'bg-red-600 text-red-100'
                            }`}>
                              {pred.points === 3 ? '🎯 +3' : pred.points === 1 ? '👍 +1' : '❌ +0'}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {filterType === 'groups' && fixtures.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupFixturesByGroup()).map(([group, matches]) => (
              <div key={group} className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <h3 className="text-2xl font-black mb-6 text-red-300 border-b border-white/20 pb-3">
                  🏆 {group}
                </h3>
                <div className="space-y-6">
                  {matches.map((match: any) => {
                    const status = getStatus(match)
                    const isFinished = match.status === 'FINISHED'
                    const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
                    const pred = predictions[match.id] || {}

                    return (
                      <div key={match.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-blue-500/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.01]">
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                            status.label === 'Finished' ? 'bg-green-600 text-green-100' :
                            status.label === 'Live' ? 'bg-red-600 text-red-100 animate-pulse' :
                            'bg-blue-600 text-blue-100'
                          }`}>
                            {status.label}
                          </span>
                          <span className="text-sm text-gray-300">{formatDate(match.utcDate)}</span>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-4 mb-4">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <FlagImage tla={match.homeTeam.tla} className="w-8 h-6 rounded border border-white/20" />
                              <p className="font-bold text-lg">{match.homeTeam.name}</p>
                            </div>
                          </div>
                          <div className="text-center bg-gradient-to-r from-blue-600/20 via-white/10 to-red-600/20 rounded-xl py-2 px-4">
                            {isFinished || isLive ? (
                              <p className="text-xl font-bold">
                                {match.score.fullTime.home ?? 0} – {match.score.fullTime.away ?? 0}
                              </p>
                            ) : (
                              <p className="text-gray-400">VS</p>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <FlagImage tla={match.awayTeam.tla} className="w-8 h-6 rounded border border-white/20" />
                              <p className="font-bold text-lg">{match.awayTeam.name}</p>
                            </div>
                          </div>
                        </div>

                        {!isFinished && !isLive && (
                          <div className="bg-black/20 rounded-xl p-4">
                            <div className="grid grid-cols-3 items-center gap-2 mb-3">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={pred.home_score ?? ''}
                                onChange={(e) => setPredictions((prev: any) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], home_score: parseInt(e.target.value) }
                                }))}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
                                placeholder="0"
                              />
                              <p className="text-center text-gray-400">–</p>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={pred.away_score ?? ''}
                                onChange={(e) => setPredictions((prev: any) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id], away_score: parseInt(e.target.value) }
                                }))}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-blue-400"
                                placeholder="0"
                              />
                            </div>
                            <button
                              onClick={() => handleSave(match.id)}
                              className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                                saved[match.id]
                                  ? 'bg-green-600 text-green-100'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}>
                              {saved[match.id] ? '✅ Saved!' : '💾 Save'}
                            </button>
                          </div>
                        )}

                        {(isFinished || isLive) && predictions[match.id] && (
                          <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center">
                            <span className="text-sm text-gray-300">
                              Your prediction: {pred.home_score} – {pred.away_score}
                            </span>
                            <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                              pred.points === 3 ? 'bg-green-600 text-green-100' :
                              pred.points === 1 ? 'bg-yellow-600 text-yellow-100' :
                              'bg-red-600 text-red-100'
                            }`}>
                              {pred.points === 3 ? '🎯 +3' : pred.points === 1 ? '👍 +1' : '❌ +0'}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}