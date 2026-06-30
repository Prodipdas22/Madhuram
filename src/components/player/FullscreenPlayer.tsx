import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Heart, ListMusic } from 'lucide-react'
import { usePlayerStore } from '../../store/player'
import { Equalizer } from './Equalizer'
import { formatDuration, generateGradient } from '../../utils'
import { useState, useEffect } from 'react'
import { toggleLike, isLiked } from '../../services/playlist'
import { useUIStore } from '../../store/ui'

export function FullscreenPlayer() {
  const { currentSong, isPlaying, volume, shuffle, repeat, progress, duration, isFullscreen,
    togglePlay, next, prev, seek, setVolume, toggleShuffle, cycleRepeat, setFullscreen } = usePlayerStore()
  const { notify } = useUIStore()
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (currentSong) isLiked(currentSong.id).then(setLiked)
  }, [currentSong?.id])

  if (!isFullscreen || !currentSong) return null

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const bg = generateGradient(currentSong.artist)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ background: bg }}
      >
        <div className="absolute inset-0 backdrop-blur-3xl bg-black/60" />

        <div className="relative z-10 flex flex-col h-full p-8 max-w-lg mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setFullscreen(false)} className="text-white/70 hover:text-white">
              <X size={24} />
            </button>
            <p className="text-sm font-medium text-white/70 uppercase tracking-widest">Now Playing</p>
            <div className="w-6" />
          </div>

          {/* Album art */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={isPlaying ? { duration: 20, repeat: Infinity, ease: 'linear' } : {}}
              className="relative"
            >
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-72 h-72 rounded-full object-cover shadow-2xl"
              />
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                    <Equalizer isPlaying />
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Song info */}
          <div className="flex items-start justify-between mb-6">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white truncate">{currentSong.title}</h2>
              <p className="text-white/70 mt-1">{currentSong.artist}</p>
            </div>
            <button
              onClick={async () => {
                const next = await toggleLike(currentSong)
                setLiked(next)
                notify(next ? 'Added to Liked Songs' : 'Removed from Liked Songs')
              }}
              className="flex-shrink-0 ml-4 mt-1"
            >
              <Heart size={24} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-accent' : 'text-white/50'} />
            </button>
          </div>

          {/* Seek bar */}
          <div className="mb-6">
            <div
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                seek(((e.clientX - rect.left) / rect.width) * duration)
              }}
            >
              <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-white/50">{formatDuration(progress)}</span>
              <span className="text-xs text-white/50">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <button onClick={toggleShuffle} className={shuffle ? 'text-accent' : 'text-white/50 hover:text-white'}>
              <Shuffle size={20} />
            </button>
            <button onClick={prev} className="text-white/80 hover:text-white">
              <SkipBack size={28} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button onClick={next} className="text-white/80 hover:text-white">
              <SkipForward size={28} fill="currentColor" />
            </button>
            <button onClick={cycleRepeat} className={repeat !== 'none' ? 'text-accent' : 'text-white/50 hover:text-white'}>
              {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-white/50" />
            <div
              className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setVolume((e.clientX - rect.left) / rect.width)
              }}
            >
              <div className="h-full bg-white rounded-full" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
