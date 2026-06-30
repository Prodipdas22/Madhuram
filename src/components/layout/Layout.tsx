import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { PlayerBar } from '../player/PlayerBar'
import { FullscreenPlayer } from '../player/FullscreenPlayer'
import { AudioEngine } from '../player/AudioEngine'
import { Notification } from '../ui/Notification'
import { AddToPlaylistModal } from '../ui/AddToPlaylistModal'
import { useUIStore } from '../../store/ui'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useLibrary } from '../../hooks/useLibrary'

export function Layout() {
  useKeyboardShortcuts()
  useLibrary()
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-bg text-white font-sans">
      <AudioEngine />
      <Sidebar />
      <main
        className="transition-all duration-300 pb-20"
        style={{ marginLeft: sidebarOpen ? '240px' : '0' }}
      >
        <TopBar />
        <div className="px-6 pb-8">
          <Outlet />
        </div>
      </main>
      <PlayerBar />
      <FullscreenPlayer />
      <Notification />
      <AddToPlaylistModal />
    </div>
  )
}