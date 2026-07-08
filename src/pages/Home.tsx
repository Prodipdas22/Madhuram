import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionRow } from '../components/ui/SectionRow'
import { SongRow } from '../components/ui/SongCard'
import { getFeaturedSongs, getSongsByGenre, getSongsByMood, getRecommendedSongs, getDiscoverWeeklySongs } from '../services/musicApi'
import { getHistory, getTopSongs } from '../services/db'
import { getTopArtists } from '../services/db'
import { generateDailyMixes } from '../services/recommendations'
import { shuffleArray } from '../services/recommendations'
import { FALLBACK_POOL } from '../services/youtube'
import type { Song } from '../types'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../store/player'
import { RefreshCw, Loader2 } from 'lucide-react'
import { hasLastFmKey } from '../services/lastfm'

const GENRES = [
  { name: 'Pop',         color: 'linear-gradient(135deg,#1db954,#117a35)' },
  { name: 'Rock',        color: 'linear-gradient(135deg,#e91429,#9c0e1c)' },
  { name: 'Hip-Hop',    color: 'linear-gradient(135deg,#8d67ab,#5b3a75)' },
  { name: 'Electronic',  color: 'linear-gradient(135deg,#e8115b,#a50d41)' },
  { name: 'Jazz',        color: 'linear-gradient(135deg,#148a08,#0d5c05)' },
  { name: 'Classical',   color: 'linear-gradient(135deg,#1e3264,#0d1f42)' },
  { name: 'R&B',         color: 'linear-gradient(135deg,#e66d00,#9c4800)' },
  { name: 'Bollywood',   color: 'linear-gradient(135deg,#ff6b35,#c0392b)' },
  { name: 'K-Pop',       color: 'linear-gradient(135deg,#af2896,#78196a)' },
  { name: 'Lo-fi',       color: 'linear-gradient(135deg,#477d95,#2e5263)' },
]

const MOODS = [
  { name: '😊 Happy',      query: 'happy upbeat feel good music' },
  { name: '😌 Chill',      query: 'chill relaxing lofi music' },
  { name: '⚡ Energetic',  query: 'energetic workout pump up music' },
  { name: '💙 Sad',        query: 'sad emotional heartbreak songs' },
  { name: '🎯 Focus',      query: 'focus study concentration music' },
  { name: '🎉 Party',      query: 'party dance hits 2024' },
  { name: '❤️ Romantic',   query: 'romantic love songs' },
  { name: '🌙 Sleep',      query: 'sleep calm ambient music' },
]

export default function Home() {
  const navigate = useNavigate()
  const { playSong } = usePlayerStore()
  const [trending, setTrending] = useState<Song[]>([])
  const [recent, setRecent] = useState<Song[]>([])
  const [recommended, setRecommended] = useState<Song[]>([])
  const [dailyMixes, setDailyMixes] = useState<Song[][]>([[], [], []])
  const [discoverWeekly, setDiscoverWeekly] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [genreCache, setGenreCache] = useState<Record<string, Song[]>>({})
  const [loadingGenre, setLoadingGenre] = useState<string | null>(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [featured, hist, topSongs, topArtistsRaw] = await Promise.all([
        getFeaturedSongs(),
        getHistory(10),
        getTopSongs(20),
        getTopArtists(5),
      ])

      setTrending(featured.length >= 4 ? featured : shuffleArray(FALLBACK_POOL).slice(0, 24))
      setRecent(hist)

      const topArtistNames = topArtistsRaw.map(a => a.name)
      const [recs, discover] = await Promise.all([
        getRecommendedSongs(topArtistNames),
        getDiscoverWeeklySongs(),
      ])

      setRecommended(recs.length >= 4 ? recs : topSongs.length >= 4 ? topSongs : shuffleArray(FALLBACK_POOL).slice(0, 12))
      setDiscoverWeekly(discover.length >= 4 ? discover : shuffleArray(FALLBACK_POOL).slice(0, 20))

      const allSongs = [...new Map([...featured, ...hist, ...topSongs, ...FALLBACK_POOL].map(s => [s.id, s])).values()]
      const mixes = await generateDailyMixes(allSongs)
      setDailyMixes(mixes.map((m, i) => m.length >= 3 ? m : shuffleArray(FALLBACK_POOL).slice(i * 6, i * 6 + 12)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleGenreClick = async (genre: string) => {
    if (genreCache[genre]) {
      const songs = genreCache[genre]
      if (songs[0]) playSong(songs[0], songs)
      return
    }
    setLoadingGenre(genre)
    try {
      const songs = await getSongsByGenre(genre)
      setGenreCache(prev => ({ ...prev, [genre]: songs }))
      if (songs[0]) playSong(songs[0], songs)
    } catch (_) {
      const fallback = shuffleArray(FALLBACK_POOL.filter(s => s.genre?.toLowerCase() === genre.toLowerCase()))
      if (fallback[0]) playSong(fallback[0], fallback)
    } finally {
      setLoadingGenre(null)
    }
  }

  const handleMoodClick = (mood: { name: string; query: string }) => {
    navigate(`/search?q=${encodeURIComponent(mood.query)}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-white">
            {greeting} 👋
          </motion.h1>
          {!hasLastFmKey() && (
            <p className="text-xs text-gray-500 mt-1">
              Add a <button onClick={() => navigate('/settings')} className="text-[#1DB954] hover:underline">Last.fm API key</button> for better recommendations
            </p>
          )}
        </div>
        <button onClick={load} aria-label="Refresh" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Continue Listening */}
      {recent.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-3">Continue Listening</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {recent.slice(0, 6).map((song, i) => (
              <SongRow key={`${song.id}-${i}`} song={song} queue={recent} index={i} />
            ))}
          </div>
        </section>
      )}

      <SectionRow title="Trending Now 🔥" songs={trending} loading={loading} />
      <SectionRow title="Recommended For You" songs={recommended} loading={loading} />

      {/* Daily Mixes */}
      {!loading && dailyMixes.some(m => m.length > 0) && (
        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-bold text-white mb-3">Daily Mixes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dailyMixes.map((mix, i) => mix.length > 0
              ? <DailyMixCard key={i} index={i + 1} songs={mix} />
              : null
            )}
          </div>
        </section>
      )}

      <SectionRow title="Discover Weekly ✨" songs={discoverWeekly} loading={loading} />

      {/* Genres */}
      <section className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-white mb-3">Genres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRES.map(g => (
            <motion.button
              key={g.name}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleGenreClick(g.name)}
              disabled={loadingGenre === g.name}
              className="rounded-xl p-4 text-sm font-bold text-white text-left relative overflow-hidden min-h-[64px] disabled:opacity-70"
              style={{ background: g.color }}
              aria-label={`Play ${g.name} music`}
            >
              {loadingGenre === g.name
                ? <Loader2 size={16} className="animate-spin" />
                : g.name}
              {genreCache[g.name] && <span className="absolute top-2 right-2 text-white/50 text-xs">▶</span>}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Moods */}
      <section className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-white mb-3">Moods</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <motion.button
              key={m.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodClick(m)}
              className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm text-gray-300 hover:bg-white/15 hover:text-white transition-colors"
            >
              {m.name}
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  )
}

function DailyMixCard({ index, songs }: { index: number; songs: Song[] }) {
  const { playSong } = usePlayerStore()
  const covers = songs.slice(0, 4).map(s => s.thumbnail)
  const artists = [...new Set(songs.map(s => s.artist))].slice(0, 2).join(', ')
  return (
    <motion.div
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className="rounded-xl bg-white/6 p-3 cursor-pointer border border-white/5 hover:border-white/10 transition-colors"
      onClick={() => playSong(songs[0], songs)}
      role="button" aria-label={`Play Daily Mix ${index}`}
    >
      <div className="grid grid-cols-2 gap-0.5 mb-3 rounded-lg overflow-hidden aspect-square">
        {[0,1,2,3].map(i => covers[i]
          ? <img key={i} src={covers[i]} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <div key={i} className="bg-white/10 w-full h-full" />
        )}
      </div>
      <p className="font-semibold text-white text-sm">Daily Mix {index}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{artists}</p>
      <p className="text-xs text-gray-600 mt-0.5">{songs.length} songs</p>
    </motion.div>
  )
}
