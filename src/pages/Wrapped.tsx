import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Flame, Clock, Music, Headphones, Mic2, Star } from 'lucide-react'
import { generateWrapped } from '../services/wrapped'
import type { WrappedData } from '../types'
import { formatMinutes } from '../utils'
import { usePlayerStore } from '../store/player'

export default function Wrapped() {
  const [data, setData] = useState<WrappedData | null>(null)
  const [loading, setLoading] = useState(true)
  const { playSong } = usePlayerStore()

  useEffect(() => {
    generateWrapped().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Generating your Wrapped…</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const year = new Date().getFullYear()
  const maxBar = Math.max(1, ...data.yearlySummary.map(m => m.minutes))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 py-12 rounded-3xl bg-gradient-to-b from-accent/20 to-transparent border border-accent/20"
      >
        <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-2">{year} in Music</p>
        <h1 className="text-5xl font-black text-white mb-2">Your Wrapped</h1>
        <p className="text-gray-400">Here's how your year sounded</p>
      </motion.div>

      <div className="space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Clock} label="Minutes Listened" value={formatMinutes(data.totalMinutes)} color="from-blue-600 to-cyan-600" delay={0.1} />
          <StatCard icon={Music} label="Top Genre" value={data.favoriteGenre} color="from-purple-600 to-pink-600" delay={0.15} />
          <StatCard icon={Flame} label="Listening Streak" value={`${data.listeningStreak} days`} color="from-orange-600 to-red-600" delay={0.2} />
          <StatCard icon={Star} label="Top Artist" value={data.topArtists[0]?.name ?? '—'} color="from-accent/80 to-emerald-600" delay={0.25} />
        </div>

        {/* Top Songs */}
        {data.topSongs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Headphones size={18} className="text-accent" />
              <h2 className="text-lg font-bold text-white">Your Top Songs</h2>
            </div>
            <div className="space-y-3">
              {data.topSongs.map((song, i) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => playSong(song, data.topSongs)}
                >
                  <span className="text-2xl font-black text-white/20 w-6 text-right">{i + 1}</span>
                  <img src={song.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">{song.title}</p>
                    <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                  </div>
                  <span className="text-xs text-gray-500">{song.listenCount ?? 0} plays</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Artists */}
        {data.topArtists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Mic2 size={18} className="text-accent" />
              <h2 className="text-lg font-bold text-white">Your Top Artists</h2>
            </div>
            <div className="space-y-3">
              {data.topArtists.map((artist, i) => (
                <div key={artist.name} className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white/20 w-6 text-right">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/40 to-purple-600/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{artist.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{artist.name}</p>
                    <div className="mt-1 h-1 bg-white/10 rounded-full">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(artist.playCount / (data.topArtists[0]?.playCount || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{artist.playCount} plays</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Monthly chart */}
        {data.yearlySummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-accent" />
              <h2 className="text-lg font-bold text-white">Monthly Listening</h2>
            </div>
            <div className="flex items-end gap-1 h-24">
              {data.yearlySummary.map(({ month, minutes }) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="w-full rounded-t bg-accent/60 hover:bg-accent transition-colors cursor-pointer"
                    style={{ height: `${(minutes / maxBar) * 80}px`, minHeight: 2, originY: 1 }}
                    title={`${month}: ${formatMinutes(minutes)}`}
                  />
                  <span className="text-xs text-gray-500">{month.slice(0, 1)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {data.totalMinutes === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-700" />
            <p>Start listening to see your stats here</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: React.ElementType; label: string; value: string; color: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      className={`rounded-2xl p-5 bg-gradient-to-br ${color} border border-white/10`}
    >
      <Icon size={20} className="text-white/70 mb-3" />
      <p className="text-2xl font-black text-white truncate">{value}</p>
      <p className="text-xs text-white/60 mt-1">{label}</p>
    </motion.div>
  )
}
