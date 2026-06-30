import { motion } from 'framer-motion'
import { Play, MoreHorizontal, Heart } from 'lucide-react'
import { usePlayerStore } from '../../store/player'
import { useUIStore } from '../../store/ui'
import { formatDuration, generateGradient } from '../../utils'
import type { Song } from '../../types'
import { useState, useEffect, useCallback } from 'react'
import { isLiked, toggleLike } from '../../services/playlist'

interface SongCardProps {
  song: Song
  queue?: Song[]
  index?: number
}

export function SongCard({ song, queue, index = 0 }: SongCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore()
  const { openAddToPlaylist } = useUIStore()
  const isCurrent = currentSong?.id === song.id
  const [hovered, setHovered] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => { isLiked(song.id).then(setLiked) }, [song.id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.06)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => playSong(song, queue)}
    >
      <div className="relative">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full aspect-square object-cover"
          onError={(e) => {
            const t = e.currentTarget
            t.style.display = 'none'
            t.nextElementSibling?.removeAttribute('style')
          }}
        />
        <div className="hidden w-full aspect-square items-center justify-center" style={{ background: generateGradient(song.artist) }}>
          <span className="text-4xl font-bold text-white/30">{song.title[0]}</span>
        </div>
        {(hovered || isCurrent) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              {isCurrent && isPlaying
                ? <div className="flex gap-0.5">{[1,2,3].map(i => <div key={i} className="w-0.5 h-3 bg-black animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}</div>
                : <Play size={16} fill="black" className="ml-0.5" />
              }
            </div>
          </motion.div>
        )}
      </div>
      <div className="p-3">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>{song.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{song.artist}</p>
      </div>
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 rounded-full p-1"
        onClick={(e) => { e.stopPropagation(); openAddToPlaylist(song) }}
      >
        <MoreHorizontal size={14} />
      </button>
    </motion.div>
  )
}

interface SongRowProps {
  song: Song
  queue?: Song[]
  index?: number
  showIndex?: boolean
}

export function SongRow({ song, queue, index = 0, showIndex = false }: SongRowProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore()
  const { openAddToPlaylist, notify } = useUIStore()
  const isCurrent = currentSong?.id === song.id
  const [liked, setLiked] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => { isLiked(song.id).then(setLiked) }, [song.id])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = await toggleLike(song)
    setLiked(next)
    notify(next ? 'Added to Liked Songs' : 'Removed from Liked Songs')
  }, [song, notify])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="group flex items-center gap-3 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => playSong(song, queue)}
    >
      {showIndex && (
        <span className="w-5 text-center text-sm text-gray-400">
          {hovered ? <Play size={14} className="text-white" /> : isCurrent ? <span className="text-accent">{index + 1}</span> : index + 1}
        </span>
      )}
      <img src={song.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>{song.title}</p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>
      {song.genre && <span className="hidden md:block text-xs text-gray-400 truncate max-w-24">{song.genre}</span>}
      <button
        onClick={handleLike}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-accent"
      >
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-accent' : ''} />
      </button>
      <span className="text-xs text-gray-400 ml-2">{formatDuration(song.duration)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); openAddToPlaylist(song) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
      >
        <MoreHorizontal size={16} />
      </button>
    </motion.div>
  )
}
