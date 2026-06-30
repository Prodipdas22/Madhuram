import { create } from 'zustand'
import type { Song, Playlist } from '../types'

interface UIState {
  sidebarOpen: boolean
  addToPlaylistModal: { open: boolean; song: Song | null }
  createPlaylistModal: boolean
  contextMenu: { x: number; y: number; song: Song | null } | null
  notification: { message: string; type: 'success' | 'error' | 'info' } | null

  setSidebar: (v: boolean) => void
  toggleSidebar: () => void
  openAddToPlaylist: (song: Song) => void
  closeAddToPlaylist: () => void
  setCreatePlaylistModal: (v: boolean) => void
  showContextMenu: (x: number, y: number, song: Song) => void
  hideContextMenu: () => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  clearNotification: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  addToPlaylistModal: { open: false, song: null },
  createPlaylistModal: false,
  contextMenu: null,
  notification: null,

  setSidebar: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openAddToPlaylist: (song) => set({ addToPlaylistModal: { open: true, song } }),
  closeAddToPlaylist: () => set({ addToPlaylistModal: { open: false, song: null } }),
  setCreatePlaylistModal: (v) => set({ createPlaylistModal: v }),
  showContextMenu: (x, y, song) => set({ contextMenu: { x, y, song } }),
  hideContextMenu: () => set({ contextMenu: null }),
  notify: (message, type = 'success') => {
    set({ notification: { message, type } })
    setTimeout(() => set({ notification: null }), 3000)
  },
  clearNotification: () => set({ notification: null })
}))

// Library store
interface LibraryState {
  playlists: Playlist[]
  likedSongs: Song[]
  setPlaylists: (p: Playlist[]) => void
  setLikedSongs: (s: Song[]) => void
  addPlaylist: (p: Playlist) => void
  removePlaylist: (id: string) => void
  updatePlaylist: (p: Playlist) => void
}

export const useLibraryStore = create<LibraryState>((set) => ({
  playlists: [],
  likedSongs: [],
  setPlaylists: (playlists) => set({ playlists }),
  setLikedSongs: (likedSongs) => set({ likedSongs }),
  addPlaylist: (p) => set((s) => ({ playlists: [p, ...s.playlists] })),
  removePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
  updatePlaylist: (p) => set((s) => ({ playlists: s.playlists.map((pl) => (pl.id === p.id ? p : pl)) }))
}))
