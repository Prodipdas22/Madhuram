import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../../store/player'
import { getArchiveStreamUrl } from '../../services/archive'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
    _ytPlayer: any
    _archiveAudio: HTMLAudioElement | null
  }
}

export function AudioEngine() {
  const { currentSong, isPlaying, volume, progress, setProgress, setDuration, onSongEnd, onPlayStarted } = usePlayerStore()
  const ytRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const seekPending = useRef<number | null>(null)
  const prevSongId = useRef<string | null>(null)

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => {}
  }, [])

  const destroyAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
      window._archiveAudio = null
    }
  }, [])

  const destroyYT = useCallback(() => {
    if (ytRef.current) {
      try { ytRef.current.destroy() } catch {}
      ytRef.current = null
      window._ytPlayer = null
    }
    if (containerRef.current) containerRef.current.innerHTML = ''
  }, [])

  // Handle song change
  useEffect(() => {
    if (!currentSong || currentSong.id === prevSongId.current) return
    prevSongId.current = currentSong.id

    destroyAudio()
    destroyYT()
    setProgress(0)
    setDuration(0)

    if (currentSong.source === 'youtube' && currentSong.videoId) {
      const div = document.createElement('div')
      div.id = `yt-${Date.now()}`
      containerRef.current?.appendChild(div)

      const initPlayer = () => {
        ytRef.current = new window.YT.Player(div.id, {
          height: '1',
          width: '1',
          videoId: currentSong.videoId,
          playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1 },
          events: {
            onReady: (e: any) => {
              e.target.setVolume(volume * 100)
              if (isPlaying) e.target.playVideo()
              onPlayStarted()
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.ENDED) onSongEnd()
              if (e.data === window.YT.PlayerState.PLAYING) {
                const dur = ytRef.current?.getDuration() ?? 0
                setDuration(dur)
              }
            }
          }
        })
        window._ytPlayer = ytRef.current
      }

      if (window.YT?.Player) initPlayer()
      else {
        const prev = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer() }
      }
    } else if (currentSong.source === 'archive' && currentSong.archiveId) {
      getArchiveStreamUrl(currentSong.archiveId).then(url => {
        if (!url) return
        const audio = new Audio(url)
        audio.volume = volume
        audioRef.current = audio
        window._archiveAudio = audio
        audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
        audio.addEventListener('ended', onSongEnd)
        audio.addEventListener('canplay', () => { onPlayStarted(); if (isPlaying) audio.play() })
      })
    } else if (currentSong.source === 'fma' && currentSong.streamUrl) {
      const audio = new Audio(currentSong.streamUrl)
      audio.volume = volume
      audioRef.current = audio
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('ended', onSongEnd)
      audio.addEventListener('canplay', () => { onPlayStarted(); if (isPlaying) audio.play() })
    }
  }, [currentSong?.id])

  // Play / Pause
  useEffect(() => {
    if (!currentSong) return
    if (currentSong.source === 'youtube') {
      if (isPlaying) ytRef.current?.playVideo?.()
      else ytRef.current?.pauseVideo?.()
    } else {
      if (!audioRef.current) return
      if (isPlaying) audioRef.current.play().catch(() => {})
      else audioRef.current.pause()
    }
  }, [isPlaying, currentSong?.source])

  // Volume
  useEffect(() => {
    ytRef.current?.setVolume?.(volume * 100)
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Seek
  useEffect(() => {
    if (seekPending.current === progress) return
    seekPending.current = progress
    if (!currentSong) return
    if (currentSong.source === 'youtube') ytRef.current?.seekTo?.(progress, true)
    else if (audioRef.current) audioRef.current.currentTime = progress
  }, [progress])

  // Progress ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) return
      if (currentSong?.source === 'youtube' && ytRef.current) {
        const t = ytRef.current.getCurrentTime?.() ?? 0
        setProgress(t)
      } else if (audioRef.current) {
        setProgress(audioRef.current.currentTime)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, currentSong?.source, setProgress])

  return <div ref={containerRef} className="hidden" aria-hidden />
}
