import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../../store/player'
import { getArchiveStreamUrl } from '../../services/archive'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
    _ytReady: boolean
    _ytReadyCallbacks: (() => void)[]
  }
}

function onYTReady(cb: () => void) {
  if (window._ytReady) { cb(); return }
  window._ytReadyCallbacks = window._ytReadyCallbacks ?? []
  window._ytReadyCallbacks.push(cb)
}

export function AudioEngine() {
  const {
    currentSong, isPlaying, volume, progress,
    setProgress, setDuration, onSongEnd, onPlayStarted
  } = usePlayerStore()

  const ytRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevSongId = useRef<string | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const volumeRef = useRef(volume)
  const lastTickedProgress = useRef(0)

  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { volumeRef.current = volume }, [volume])

  const destroyAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current.load()
      audioRef.current = null
    }
  }, [])

  const destroyYT = useCallback(() => {
    if (ytRef.current) {
      try { ytRef.current.destroy() } catch (_) {}
      ytRef.current = null
    }
    if (containerRef.current) containerRef.current.innerHTML = ''
  }, [])

  function buildAudio(url: string): HTMLAudioElement {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    audio.volume = volumeRef.current
    audio.src = url
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('ended', onSongEnd)
    audio.addEventListener('canplaythrough', () => {
      onPlayStarted()
      if (isPlayingRef.current) audio.play().catch(() => {})
    })
    audio.addEventListener('error', () => {
      console.warn('Audio error for', url)
      onSongEnd()
    })
    return audio
  }

  // ── Song change ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong || currentSong.id === prevSongId.current) return
    prevSongId.current = currentSong.id
    lastTickedProgress.current = 0
    destroyAudio()
    destroyYT()
    setProgress(0)
    setDuration(0)

    // ── Deezer preview (30s MP3) ──────────────────────────────────
    if (currentSong.source === 'deezer' && currentSong.previewUrl) {
      audioRef.current = buildAudio(currentSong.previewUrl)

    // ── YouTube embed ─────────────────────────────────────────────
    } else if (currentSong.source === 'youtube' && currentSong.videoId) {
      const divId = `yt-${Date.now()}`
      const div = document.createElement('div')
      div.id = divId
      containerRef.current?.appendChild(div)

      const createPlayer = () => {
        ytRef.current = new window.YT.Player(divId, {
          videoId: currentSong.videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              try { e.target.setPlaybackQuality('hd720') } catch (_) {}
              e.target.setVolume(Math.round(volumeRef.current * 100))
              const dur = e.target.getDuration?.() ?? 0
              if (dur > 0) setDuration(dur)
              onPlayStarted()
              if (isPlayingRef.current) e.target.playVideo()
            },
            onStateChange: (e: any) => {
              const S = window.YT?.PlayerState
              if (e.data === S?.ENDED) onSongEnd()
              if (e.data === S?.PLAYING) {
                const dur = ytRef.current?.getDuration?.() ?? 0
                if (dur > 0) setDuration(dur)
              }
            },
            onError: () => onSongEnd(),
          }
        })
      }
      onYTReady(createPlayer)

    // ── Internet Archive ──────────────────────────────────────────
    } else if (currentSong.source === 'archive' && currentSong.archiveId) {
      getArchiveStreamUrl(currentSong.archiveId).then(url => {
        if (!url) { onSongEnd(); return }
        audioRef.current = buildAudio(url)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id])

  // ── Play / Pause ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong) return
    if (currentSong.source === 'youtube') {
      if (isPlaying) ytRef.current?.playVideo?.()
      else ytRef.current?.pauseVideo?.()
    } else if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {})
      else audioRef.current.pause()
    }
  }, [isPlaying, currentSong?.source])

  // ── Volume ───────────────────────────────────────────────────────
  useEffect(() => {
    if (ytRef.current?.setVolume) ytRef.current.setVolume(Math.round(volume * 100))
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // ── Seek (only on deliberate seek, not ticker) ───────────────────
  useEffect(() => {
    const diff = Math.abs(progress - lastTickedProgress.current)
    if (diff < 1.5) return
    if (!currentSong) return
    if (currentSong.source === 'youtube') {
      ytRef.current?.seekTo?.(progress, true)
    } else if (audioRef.current) {
      audioRef.current.currentTime = progress
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  // ── Progress ticker ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlayingRef.current) return
      let t = 0
      if (currentSong?.source === 'youtube' && ytRef.current) {
        t = ytRef.current.getCurrentTime?.() ?? 0
      } else if (audioRef.current && !audioRef.current.paused) {
        t = audioRef.current.currentTime
      }
      if (t > 0) {
        lastTickedProgress.current = t
        setProgress(t)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [currentSong?.source, setProgress])

  // ── Load YT API once ─────────────────────────────────────────────
  useEffect(() => {
    window._ytReadyCallbacks = window._ytReadyCallbacks ?? []
    if (window._ytReady) return
    window.onYouTubeIframeAPIReady = () => {
      window._ytReady = true
      for (const cb of window._ytReadyCallbacks ?? []) {
        try { cb() } catch (_) {}
      }
      window._ytReadyCallbacks = []
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      document.head.appendChild(tag)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}
    />
  )
}
