import { Heart, Play, Shuffle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../store/ui'
import { usePlayerStore } from '../store/player'
import { SongRow } from '../components/ui/SongCard'
import { shuffleArray } from '../services/recommendations'

export default function LikedSongs() {
  const { likedSongs } = useLibraryStore()
  const { playSong } = usePlayerStore()

  return (
    <div>
      <div className="flex items-end gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-2xl">
          <Heart size={48} fill="white" className="text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Playlist</p>
          <h1 className="text-4xl font-bold text-white mb-2">Liked Songs</h1>
          <p className="text-gray-400 text-sm">{likedSongs.length} songs</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => likedSongs[0] && playSong(likedSongs[0], likedSongs)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent text-black font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button
              onClick={() => { const shuffled = shuffleArray(likedSongs); if (shuffled[0]) playSong(shuffled[0], shuffled) }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/15 transition-colors"
            >
              <Shuffle size={16} /> Shuffle
            </button>
          </div>
        </div>
      </div>

      {likedSongs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Heart size={48} className="mx-auto mb-4 text-gray-700" />
          <p>Songs you like will appear here</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {likedSongs.map((song, i) => (
            <SongRow key={song.id} song={song} queue={likedSongs} index={i} showIndex />
          ))}
        </div>
      )}
    </div>
  )
}
