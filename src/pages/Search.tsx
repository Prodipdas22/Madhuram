import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X, Clock, Loader2, Music, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { unifiedSearch } from '../services/musicApi'
import { getSearchHistory, addSearchHistory } from '../services/db'
import { useDebounce } from '../hooks/useDebounce'
import { SongRow } from '../components/ui/SongCard'
import type { Song } from '../types'

const QUICK_SEARCHES = [
  'Arijit Singh', 'Taylor Swift', 'The Weeknd', 'BTS',
  'Ed Sheeran', 'Bollywood hits', 'Lo-fi chill', 'Hip Hop 2024',
  'Alan Walker', 'Dua Lipa', 'K-Pop hits', 'Classic Rock',
]

export default function Search() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeSource, setActiveSource] = useState<'all' | 'deezer' | 'youtube'>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebounce(query, 400)

  useEffect(() => { getSearchHistory().then(setHistory) }, [])

  // Auto-search from URL param
  useEffect(() => {
    const q = params.get('q')
    if (q) { setQuery(q); setShowDropdown(false) }
  }, [params])

  useEffect(() => {
    if (!debounced.trim()) { setResults([]); setError(null); return }
    setLoading(true)
    setError(null)
    addSearchHistory(debounced).catch(() => {})

    unifiedSearch(debounced, 40)
      .then(songs => {
        let filtered = songs
        if (activeSource === 'deezer') filtered = songs.filter(s => s.source === 'deezer')
        if (activeSource === 'youtube') filtered = songs.filter(s => s.source === 'youtube')
        setResults(filtered)
        setError(filtered.length === 0 ? 'No results found. Try different keywords.' : null)
      })
      .catch(() => setError('Search failed. Check your internet connection.'))
      .finally(() => setLoading(false))
  }, [debounced, activeSource])

  const handleSelect = useCallback((q: string) => {
    setQuery(q); setShowDropdown(false); inputRef.current?.blur()
  }, [])

  const filteredHistory = history.filter(h =>
    !query || h.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3.5 border border-white/10 focus-within:border-[#1DB954]/60 focus-within:bg-white/12 transition-all">
          {loading
            ? <Loader2 size={18} className="text-[#1DB954] flex-shrink-0 animate-spin" />
            : <SearchIcon size={18} className="text-gray-400 flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={e => e.key === 'Escape' && setQuery('')}
            placeholder="Songs, artists, genres…"
            aria-label="Search music"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm md:text-base"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }} aria-label="Clear" className="text-gray-400 hover:text-white p-1">
              <X size={16} />
            </button>
          )}
        </div>

        {/* History dropdown */}
        <AnimatePresence>
          {showDropdown && filteredHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-2 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
            >
              <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Recent</div>
              {filteredHistory.map(h => (
                <button key={h} onMouseDown={() => handleSelect(h)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3">
                  <Clock size={13} className="text-gray-500 flex-shrink-0" />{h}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Source tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {(['all', 'deezer', 'youtube'] as const).map(s => (
          <button key={s} onClick={() => setActiveSource(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              activeSource === s ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/15'
            }`}>
            {s === 'all' ? '🎵 All Sources' : s === 'deezer' ? '🎧 Deezer (Preview)' : '▶️ YouTube (Full)'}
          </button>
        ))}
      </div>

      {/* Source info banner */}
      {activeSource === 'deezer' && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          🎧 Deezer provides 30-second high-quality audio previews — no account needed
        </div>
      )}
      {activeSource === 'youtube' && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          ▶️ YouTube plays full songs via embed
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 animate-pulse">
              <div className="w-10 h-10 rounded bg-white/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error / no results */}
      {!loading && error && (
        <div className="text-center py-16">
          <Music size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_SEARCHES.slice(0, 4).map(q => (
              <button key={q} onClick={() => setQuery(q)}
                className="px-3 py-1.5 rounded-full bg-white/10 text-sm text-gray-300 hover:bg-white/20 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm text-gray-500 mb-3">
            {results.length} results for "<span className="text-gray-300">{query}</span>"
          </p>
          <div className="space-y-0.5">
            {results.map((song, i) => (
              <SongRow key={`${song.id}-${i}`} song={song} queue={results} index={i} showIndex />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!query && !loading && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Radio size={16} className="text-[#1DB954]" />
            <span className="text-sm font-semibold text-gray-300">Try searching for</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => setQuery(q)}
                className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm text-gray-300 hover:bg-white/15 hover:text-white transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
