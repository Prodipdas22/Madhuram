import { NavLink } from 'react-router-dom'
import { Home, Search, Library, Radio, BarChart3, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore, useLibraryStore } from '../../store/ui'
import { usePlayerStore } from '../../store/player'
import { generateGradient } from '../../utils'
import { createPlaylist } from '../../services/playlist'
import { useLibrary } from '../../hooks/useLibrary'

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/wrapped', icon: BarChart3, label: 'Your Wrapped' },
]

export function Sidebar() {
  const { sidebarOpen, notify } = useUIStore()
  const { playlists } = useLibraryStore()
  const { playSong } = usePlayerStore()
  const { refresh } = useLibrary()

  const handleCreatePlaylist = async () => {
    const name = `My Playlist #${playlists.length + 1}`
    await createPlaylist(name)
    await refresh()
    notify(`Created "${name}"`)
  }

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -240 }}
          animate={{ x: 0 }}
          exit={{ x: -240 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-20 w-60 bg-black z-40 flex flex-col overflow-hidden"
        >
          {/* Logo */}
          <div className="px-6 py-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Radio size={16} className="text-black" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Madhuram</span>
          </div>

          {/* Main nav */}
          <nav className="px-3 mb-4">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mx-4 border-t border-white/10 mb-4" />

          {/* Library */}
          <div className="px-4 flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Library</span>
            <button onClick={handleCreatePlaylist} className="text-gray-400 hover:text-white transition-colors">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
            {/* Liked songs */}
            <NavLink
              to="/library/liked"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs">♥</span>
              </div>
              <span className="truncate">Liked Songs</span>
            </NavLink>

            {/* User playlists */}
            {playlists.map(pl => (
              <NavLink
                key={pl.id}
                to={`/playlist/${pl.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                <div
                  className="w-8 h-8 rounded flex-shrink-0"
                  style={{ background: generateGradient(pl.name) }}
                />
                <span className="truncate">{pl.name}</span>
              </NavLink>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}