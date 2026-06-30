import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song, QueueItem } from '../types'
import { shuffleArray } from '../services/recommendations'
import { recordPlay } from '../services/db'

interface PlayerState {
  currentSong: Song | null
  queue: QueueItem[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
  progress: number      // seconds
  duration: number      // seconds
  isFullscreen: boolean
  isMiniPlayer: boolean
  playStartedAt: number | null

  // actions
  playSong: (song: Song, queue?: Song[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setProgress: (s: number) => void
  setDuration: (s: number) => void
  addToQueue: (song: Song) => void
  clearQueue: () => void
  setFullscreen: (v: boolean) => void
  setMiniPlayer: (v: boolean) => void
  onSongEnd: () => void
  onPlayStarted: () => void
}

function makeQueueItem(song: Song): QueueItem {
  return { ...song, queueId: `${song.id}-${Date.now()}-${Math.random()}` }
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      volume: 0.8,
      shuffle: false,
      repeat: 'none',
      progress: 0,
      duration: 0,
      isFullscreen: false,
      isMiniPlayer: false,
      playStartedAt: null,

      playSong: (song, queue) => {
        const items = (queue ?? [song]).map(makeQueueItem)
        const idx = queue ? queue.findIndex(s => s.id === song.id) : 0
        set({ currentSong: song, queue: items, queueIndex: Math.max(0, idx), isPlaying: true, progress: 0 })
      },

      pause: () => {
        const { currentSong, playStartedAt } = get()
        if (currentSong && playStartedAt) {
          const elapsed = (Date.now() - playStartedAt) / 1000
          recordPlay(currentSong, elapsed).catch(console.error)
        }
        set({ isPlaying: false, playStartedAt: null })
      },

      resume: () => set({ isPlaying: true, playStartedAt: Date.now() }),

      togglePlay: () => {
        const { isPlaying } = get()
        if (isPlaying) get().pause()
        else get().resume()
      },

      next: () => {
        const { queue, queueIndex, shuffle, repeat } = get()
        if (!queue.length) return
        let nextIdx: number
        if (shuffle) {
          nextIdx = Math.floor(Math.random() * queue.length)
        } else if (queueIndex < queue.length - 1) {
          nextIdx = queueIndex + 1
        } else if (repeat === 'all') {
          nextIdx = 0
        } else {
          set({ isPlaying: false })
          return
        }
        const next = queue[nextIdx]
        set({ currentSong: next, queueIndex: nextIdx, progress: 0, isPlaying: true, playStartedAt: Date.now() })
      },

      prev: () => {
        const { queue, queueIndex, progress } = get()
        if (progress > 3) { set({ progress: 0 }); return }
        const prevIdx = Math.max(0, queueIndex - 1)
        const prev = queue[prevIdx]
        if (prev) set({ currentSong: prev, queueIndex: prevIdx, progress: 0, isPlaying: true, playStartedAt: Date.now() })
      },

      seek: (seconds) => set({ progress: seconds }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      toggleShuffle: () => {
        const { shuffle, queue, queueIndex } = get()
        if (!shuffle) {
          const current = queue[queueIndex]
          const rest = queue.filter((_, i) => i !== queueIndex)
          const shuffled = shuffleArray(rest)
          set({ shuffle: true, queue: [current, ...shuffled], queueIndex: 0 })
        } else {
          set({ shuffle: false })
        }
      },
      cycleRepeat: () => {
        const { repeat } = get()
        const next = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none'
        set({ repeat: next })
      },
      setProgress: (s) => set({ progress: s }),
      setDuration: (s) => set({ duration: s }),
      addToQueue: (song) => set(s => ({ queue: [...s.queue, makeQueueItem(song)] })),
      clearQueue: () => set({ queue: [] }),
      setFullscreen: (v) => set({ isFullscreen: v }),
      setMiniPlayer: (v) => set({ isMiniPlayer: v }),
      onPlayStarted: () => set({ playStartedAt: Date.now() }),

      onSongEnd: () => {
        const { repeat, currentSong, playStartedAt, duration } = get()
        if (currentSong && playStartedAt) {
          recordPlay(currentSong, duration).catch(console.error)
        }
        if (repeat === 'one') {
          set({ progress: 0, isPlaying: true, playStartedAt: Date.now() })
        } else {
          get().next()
        }
      }
    }),
    {
      name: 'madhuram-player',
      partialize: (s) => ({ volume: s.volume, shuffle: s.shuffle, repeat: s.repeat })
    }
  )
)
