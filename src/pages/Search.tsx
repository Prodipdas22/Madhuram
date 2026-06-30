import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X, Mic, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { globalSearch, getAutocomplete } from '../services/search'
import { getSearchHistory } from '../services/db'
import { useDebounce } from '../hooks/useDebounce'
import { SongRow } from '../components/ui/SongCard'
import type { Song } from '../types'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [autocomplete, setAutocomplete] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeSource, setActiveSource] = useState<'all' | 'youtube' | 'archive' | 'fma'>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounced = useDebounce(query, 350)

  useEffect(() => {
    getSearchHistory().then(setHistory)
  }, [])

  // Autocomplete from history + results
  useEffect(() => {
    const ac = getAutocomplete(query, results)
    setAutocomplete([...new Set([...ac, ...history.filter(h => h.toLowerCase().includes(query.toLowerCase()))])].slice(0, 6))
  }, [query, results, history])

  // Fetch results
  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return }
    setLoading(true)
    const sources: ('youtube' | 'archive' | 'fma')[] = activeSource === 'all' ? ['youtube', 'archive', 'fma'] : [activeSource]
    globalSearch(debounced, sources)
      .then(r => { setResults(r); setLoading(false) })
      .catch(() => setLoading(false))
    setParams({ q: debounced }, { replace: true })
  }, [debounced, activeSource])

  const handleSelect = useCallback((q: string) => {
    setQuery(q)
    setShowDropdown(false)
    inputRef.current?.blur()
  }, [])

  const SOURCES = ['all', 'youtube', 'archive', 'fma'] as const

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-3 focus-within:bg-white/15 transition-colors border border-white/10 focus-within:border-white/20">
          <SearchIcon size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="What do you want to listen to?"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          )}
          <button className="text-gray-400 hover:text-white">
            <Mic size={16} />
          </button>
        </div>

        {/* Autocomplete dropdown */}
        <AnimatePresence>
          {showDropdown && (autocomplete.length > 0 || history.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-2 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-10 shadow-2xl"
            >
              {autocomplete.map(s => (
                <button
                  key={s}
                  onMouseDown={() => handleSelect(s)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3"
                >
                  <SearchIcon size={14} className="text-gray-500" />
                  {s}
                </button>
              ))}
              {history.length > 0 && !query && (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 font-medium border-t border-white/5">Recent searches</div>
                  {history.slice(0, 5).map(h => (
                    <button
                      key={h}
                      onMouseDown={() => handleSelect(h)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3"
                    >
                      <Clock size={14} className="text-gray-500" />
                      {h}
                    </button>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Source filters */}
      <div className="flex gap-2 mb-6">
        {SOURCES.map(s => (
          <button
            key={s}
            onClick={() => setActiveSource(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              activeSource === s ? 'bg-white text-black' : 'bg-white/10 text-gray-300 hover:bg-white/15'
            }`}
          >
            {s === 'archive' ? 'Internet Archive' : s === 'fma' ? 'Free Music Archive' : s}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-md animate-pulse">
              <div className="w-10 h-10 rounded bg-white/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/10 rounded w-1/2" />
                <div className="h-2 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm text-gray-400 mb-3">{results.length} results for "{query}"</p>
          <div className="space-y-0.5">
            {results.map((song, i) => (
              <SongRow key={`${song.id}-${i}`} song={song} queue={results} index={i} showIndex />
            ))}
          </div>
        </motion.div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400">No results found for "{query}"</p>
          <p className="text-sm text-gray-600 mt-2">Try a different search or check your connection</p>
        </div>
      )}

      {!query && !loading && (
        <div className="text-center py-16">
          <SearchIcon size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">Search for songs, artists, or genres</p>
        </div>
      )}
    </div>
  )
}
