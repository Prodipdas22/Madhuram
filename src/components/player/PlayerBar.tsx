import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Maximize2, ListMusic, Heart } from 'lucide-react'
import { usePlayerStore } from '../../store/player'
import { Equalizer } from './Equalizer'
import { formatDuration } from '../../utils'
import { useState, useCallback } from 'react'
import { toggleLike, isLiked } from '../../services/playlist'
import { useEffect } from 'react'
import { useUIStore } from '../../store/ui'

export function PlayerBar() {
  const {
    currentSong, isPlaying, volume, shuffle, repeat, progress, duration,
    togglePlay, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, setFullscreen
  } = usePlayerStore()
  const { notify } = useUIStore()
  const [liked, setLiked] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)

  useEffect(() => {
    if (!dragging) setLocalProgress(progress)
  }, [progress, dragging])

  useEffect(() => {
    if (currentSong) isLiked(currentSong.id).then(setLiked)
  }, [currentSong?.id])

  const handleLike = useCallback(async () => {
    if (!currentSong) return
    const next = await toggleLike(currentSong)
    setLiked(next)
    notify(next ? 'Added to Liked Songs' : 'Removed from Liked Songs')
  }, [currentSong, notify])

  const pct = duration > 0 ? (localProgress / duration) * 100 : 0

  if (!currentSong) return null

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 flex items-center gap-4"
    >
      {/* Song info */}
      <div className="flex items-center gap-3 w-64 min-w-0">
        <div className="relative flex-shrink-0">
          <motion.img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-12 h-12 rounded object-cover"
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={isPlaying ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Equalizer isPlaying className="opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
          <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
        </div>
        <button onClick={handleLike} className="flex-shrink-0 text-gray-400 hover:text-accent transition-colors">
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-accent' : ''} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={toggleShuffle} className={`transition-colors ${shuffle ? 'text-accent' : 'text-gray-400 hover:text-white'}`}>
            <Shuffle size={16} />
          </button>
          <button onClick={prev} className="text-gray-300 hover:text-white transition-colors">
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button onClick={next} className="text-gray-300 hover:text-white transition-colors">
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button onClick={cycleRepeat} className={`transition-colors ${repeat !== 'none' ? 'text-accent' : 'text-gray-400 hover:text-white'}`}>
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-gray-400 w-8 text-right">{formatDuration(localProgress)}</span>
          <div
            className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const ratio = (e.clientX - rect.left) / rect.width
              seek(ratio * duration)
            }}
          >
            <div className="h-full bg-white group-hover:bg-accent rounded-full transition-colors relative" style={{ width: `${pct}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-xs text-gray-400 w-8">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 w-48 justify-end">
        <button className="text-gray-400 hover:text-white transition-colors">
          <ListMusic size={16} />
        </button>
        <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="text-gray-400 hover:text-white transition-colors">
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div
          className="w-20 h-1 bg-white/20 rounded-full cursor-pointer group relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setVolume((e.clientX - rect.left) / rect.width)
          }}
        >
          <div className="h-full bg-white group-hover:bg-accent rounded-full transition-colors" style={{ width: `${volume * 100}%` }} />
        </div>
        <button onClick={() => setFullscreen(true)} className="text-gray-400 hover:text-white transition-colors">
          <Maximize2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}
