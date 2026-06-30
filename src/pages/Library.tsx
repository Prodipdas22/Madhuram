import { Link } from 'react-router-dom'
import { Plus, Heart, History, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../store/ui'
import { generateGradient } from '../utils'
import { createPlaylist } from '../services/playlist'
import { useLibrary } from '../hooks/useLibrary'
import { useUIStore } from '../store/ui'

export default function Library() {
  const { playlists, likedSongs } = useLibraryStore()
  const { refresh } = useLibrary()
  const { notify } = useUIStore()

  const handleCreate = async () => {
    const name = `My Playlist #${playlists.length + 1}`
    await createPlaylist(name)
    await refresh()
    notify(`Created "${name}"`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Library</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-black text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} /> New Playlist
        </button>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        <Link to="/library/liked">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-white/10"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
              <Heart size={20} className="text-white" fill="white" />
            </div>
            <div>
              <p className="font-semibold text-white">Liked Songs</p>
              <p className="text-sm text-gray-400">{likedSongs.length} songs</p>
            </div>
          </motion.div>
        </Link>

        <Link to="/library/history">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-900/60 to-teal-900/60 border border-white/10"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-500 flex items-center justify-center">
              <History size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Listening History</p>
              <p className="text-sm text-gray-400">Your recent plays</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Playlists */}
      <h2 className="text-xl font-bold text-white mb-4">Playlists</h2>
      {playlists.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Music size={48} className="mx-auto mb-4 text-gray-700" />
          <p>No playlists yet</p>
          <button onClick={handleCreate} className="mt-4 text-accent text-sm hover:underline">Create your first playlist</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((pl, i) => (
            <Link key={pl.id} to={`/playlist/${pl.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="rounded-xl overflow-hidden bg-white/6 cursor-pointer"
              >
                <div className="aspect-square" style={{ background: generateGradient(pl.name) }}>
                  {pl.songs[0] && (
                    <img src={pl.songs[0].thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pl.songs.length} songs</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
