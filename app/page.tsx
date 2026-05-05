import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 text-white relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"></div>
      </div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 text-9xl animate-spin-slow">⚽</div>
        <div className="absolute bottom-20 right-10 text-7xl animate-pulse">🏆</div>
        <div className="absolute top-1/3 right-1/4 text-5xl animate-bounce delay-500">🌍</div>
        <div className="absolute bottom-1/3 left-1/3 text-4xl animate-spin-slow delay-700">🇶🇦</div>
      </div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-9xl mb-6 animate-bounce drop-shadow-2xl">⚽</div>
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
          FIFA World Cup 2026
        </h1>
        <h2 className="text-2xl font-bold mb-6 text-blue-200">Official Prediction Game</h2>
        <p className="text-gray-200 text-xl mb-12 leading-relaxed max-w-xl mx-auto">
          Experience the thrill of the 2026 World Cup! Predict match outcomes, earn points, and compete globally with millions of fans. The ultimate football prediction challenge awaits! 🏆
        </p>
        <div className="flex gap-8 justify-center mb-8">
          <Link href="/register"
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-110 transition-all duration-300 border-2 border-blue-400 hover:border-blue-300 glow-blue">
            🚀 JOIN NOW
          </Link>
          <Link href="/login"
            className="border-2 border-white/30 hover:border-white/60 text-white hover:text-blue-200 px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm hover:scale-105">
            SIGN IN
          </Link>
        </div>
        
        <div className="mt-12 text-gray-300">
          <p className="text-lg font-medium">🏆 Global Competition • 🎯 Expert Predictions • 🌍 Worldwide Community</p>
        </div>
        
        {/* FIFA logo inspired element */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <span className="text-2xl">🇶🇦</span>
            <span className="text-white font-bold">Hosted by Qatar 2026</span>
            <span className="text-2xl">🇺🇸</span>
            <span className="text-2xl">🇨🇦</span>
            <span className="text-2xl">🇲🇽</span>
          </div>
        </div>
      </div>
    </main>
  )
}