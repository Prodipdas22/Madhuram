import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check } from 'lucide-react'
import { useUIStore, useLibraryStore } from '../../store/ui'
import { addSongToPlaylist, createPlaylist } from '../../services/playlist'
import { useLibrary } from '../../hooks/useLibrary'
import { useState } from 'react'

export function AddToPlaylistModal() {
  const { addToPlaylistModal, closeAddToPlaylist, notify } = useUIStore()
  const { playlists } = useLibraryStore()
  const { refresh } = useLibrary()
  const [added, setAdded] = useState<string | null>(null)
  const { open, song } = addToPlaylistModal

  const handleAdd = async (playlistId: string) => {
    if (!song) return
    await addSongToPlaylist(playlistId, song)
    setAdded(playlistId)
    await refresh()
    notify('Added to playlist')
    setTimeout(() => { setAdded(null); closeAddToPlaylist() }, 800)
  }

  const handleCreate = async () => {
    if (!song) return
    const pl = await createPlaylist(`Playlist from ${song.artist}`, [song])
    await refresh()
    notify(`Created and added to "${pl.name}"`)
    closeAddToPlaylist()
  }

  return (
    <AnimatePresence>
      {open && song && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeAddToPlaylist}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-80 rounded-2xl bg-gray-900 border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Add to Playlist</h3>
              <button onClick={closeAddToPlaylist} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4 truncate">"{song.title}"</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <Plus size={16} className="text-accent" />
                </div>
                <span className="text-sm text-white">Create new playlist</span>
              </button>
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
                    {added === pl.id ? <Check size={14} className="text-accent" /> : <span className="text-xs text-accent">♪</span>}
                  </div>
                  <span className="text-sm text-white truncate">{pl.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{pl.songs.length}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
