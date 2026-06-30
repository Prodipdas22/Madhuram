import { useEffect, useState } from 'react'
import { SectionRow } from '../components/ui/SectionRow'
import { SongRow } from '../components/ui/SongCard'
import { getTrendingMusic } from '../services/youtube'
import { getHistory, getTopSongs } from '../services/db'
import { generateDailyMixes, generateDiscoverWeekly } from '../services/recommendations'
import type { Song } from '../types'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../store/player'

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Folk', 'Ambient', 'Country']
const MOODS = ['Happy', 'Chill', 'Energetic', 'Sad', 'Focus', 'Party', 'Romantic', 'Sleep']

export default function Home() {
  const [trending, setTrending] = useState<Song[]>([])
  const [recent, setRecent] = useState<Song[]>([])
  const [recommended, setRecommended] = useState<Song[]>([])
  const [dailyMixes, setDailyMixes] = useState<Song[][]>([[], [], []])
  const [discoverWeekly, setDiscoverWeekly] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    async function load() {
      const [trend, hist, top] = await Promise.all([
        getTrendingMusic(),
        getHistory(10),
        getTopSongs(20)
      ])
      setTrending(trend)
      setRecent(hist)
      setRecommended(top.length ? top : trend.slice(0, 12))

      const allSongs = [...new Map([...trend, ...hist, ...top].map(s => [s.id, s])).values()]
      const [mixes, discover] = await Promise.all([
        generateDailyMixes(allSongs),
        generateDiscoverWeekly(allSongs)
      ])
      setDailyMixes(mixes)
      setDiscoverWeekly(discover.length ? discover : trend.slice(10, 20))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-8"
      >
        {greeting}
      </motion.h1>

      {/* Quick picks */}
      {recent.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Continue Listening</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {recent.slice(0, 6).map((song, i) => (
              <SongRow key={`${song.id}-${i}`} song={song} queue={recent} index={i} />
            ))}
          </div>
        </section>
      )}

      <SectionRow title="Trending Now" songs={trending} loading={loading} viewAllTo="/search?q=trending" />
      <SectionRow title="Recommended For You" songs={recommended} loading={loading} />

      {/* Daily Mixes */}
      {!loading && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Daily Mixes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dailyMixes.map((mix, i) => (
              <DailyMixCard key={i} index={i + 1} songs={mix} />
            ))}
          </div>
        </section>
      )}

      <SectionRow title="Discover Weekly" songs={discoverWeekly} />

      {/* Genres */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Genres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {GENRES.map((g, i) => (
            <a
              key={g}
              href={`/search?q=${g}`}
              className="rounded-xl p-4 text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }}
            >
              {g}
            </a>
          ))}
        </div>
      </section>

      {/* Moods */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Moods</h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <a
              key={m}
              href={`/search?q=${m}+music`}
              className="px-4 py-2 rounded-full bg-white/8 text-sm text-gray-300 hover:bg-white/15 hover:text-white transition-colors border border-white/10"
            >
              {m}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

function DailyMixCard({ index, songs }: { index: number; songs: Song[] }) {
  const covers = songs.slice(0, 4).map(s => s.thumbnail)
  const { playSong } = usePlayerStore()

  if (!songs.length) return null

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl bg-white/6 p-4 cursor-pointer group"
      onClick={() => playSong(songs[0], songs)}
    >
      <div className="grid grid-cols-2 gap-1 mb-3 rounded-lg overflow-hidden">
        {[0, 1, 2, 3].map(i => (
          covers[i]
            ? <img key={i} src={covers[i]} alt="" className="w-full aspect-square object-cover" />
            : <div key={i} className="aspect-square bg-white/10" />
        ))}
      </div>
      <p className="font-semibold text-white">Daily Mix {index}</p>
      <p className="text-xs text-gray-400 mt-0.5">{songs.slice(0, 3).map(s => s.artist).join(', ')}</p>
    </motion.div>
  )
}

const GENRE_COLORS = [
  'linear-gradient(135deg,#1db954,#117a35)',
  'linear-gradient(135deg,#e91429,#9c0e1c)',
  'linear-gradient(135deg,#8d67ab,#5b3a75)',
  'linear-gradient(135deg,#e8115b,#a50d41)',
  'linear-gradient(135deg,#148a08,#0d5c05)',
  'linear-gradient(135deg,#1e3264,#0d1f42)',
  'linear-gradient(135deg,#e66d00,#9c4800)',
  'linear-gradient(135deg,#477d95,#2e5263)',
  'linear-gradient(135deg,#af2896,#78196a)',
  'linear-gradient(135deg,#b02897,#7a1c68)'
]
