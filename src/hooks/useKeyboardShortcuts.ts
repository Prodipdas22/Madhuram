import { useEffect } from 'react'
import { usePlayerStore } from '../store/player'

export function useKeyboardShortcuts() {
  const { togglePlay, next, prev, setVolume, volume, seek, progress } = usePlayerStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (e.shiftKey) next()
          else seek(progress + 10)
          break
        case 'ArrowLeft':
          if (e.shiftKey) prev()
          else seek(Math.max(0, progress - 10))
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(volume + 0.05)
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(volume - 0.05)
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, next, prev, setVolume, volume, seek, progress])
}
