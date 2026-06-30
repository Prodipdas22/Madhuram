import type { Song } from '../types'

// Uses YouTube oEmbed (no API key) + invidious public API as fallback
const INVIDIOUS_INSTANCES = [
  'https://invidious.io',
  'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de'
]

export async function searchYouTube(query: string, maxResults = 20): Promise<Song[]> {
  // Try Invidious public API (no key needed)
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,videoThumbnails,lengthSeconds`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      const data = await res.json()
      if (!Array.isArray(data)) continue
      return data.slice(0, maxResults).map((v: InvidiousVideo) => ({
        id: `yt-${v.videoId}`,
        title: v.title,
        artist: v.author,
        thumbnail: v.videoThumbnails?.find(t => t.quality === 'medium')?.url
          ?? `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
        duration: v.lengthSeconds ?? 0,
        source: 'youtube' as const,
        videoId: v.videoId
      }))
    } catch {
      // try next instance
    }
  }
  return []
}

export async function getTrendingMusic(): Promise<Song[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/trending?type=music&fields=videoId,title,author,videoThumbnails,lengthSeconds`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      const data = await res.json()
      if (!Array.isArray(data)) continue
      return data.slice(0, 30).map((v: InvidiousVideo) => ({
        id: `yt-${v.videoId}`,
        title: v.title,
        artist: v.author,
        thumbnail: v.videoThumbnails?.find(t => t.quality === 'medium')?.url
          ?? `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
        duration: v.lengthSeconds ?? 0,
        source: 'youtube' as const,
        videoId: v.videoId
      }))
    } catch {
      // continue
    }
  }
  // Fallback: curated seed songs
  return SEED_TRENDING
}

interface InvidiousVideo {
  videoId: string
  title: string
  author: string
  lengthSeconds: number
  videoThumbnails: { quality: string; url: string }[]
}

// Curated seed data for when APIs are unavailable
const SEED_TRENDING: Song[] = [
  { id: 'yt-dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 213, source: 'youtube', videoId: 'dQw4w9WgXcQ' },
  { id: 'yt-9bZkp7q19f0', title: 'Gangnam Style', artist: 'PSY', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg', duration: 252, source: 'youtube', videoId: '9bZkp7q19f0' },
  { id: 'yt-kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg', duration: 282, source: 'youtube', videoId: 'kJQP7kiw5Fk' },
  { id: 'yt-OPf0YbXqDm0', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg', duration: 234, source: 'youtube', videoId: 'JGwWNGJdvx8' },
  { id: 'yt-fRh_vgS2dFE', title: 'Sorry', artist: 'Justin Bieber', thumbnail: 'https://i.ytimg.com/vi/fRh_vgS2dFE/mqdefault.jpg', duration: 200, source: 'youtube', videoId: 'fRh_vgS2dFE' },
  { id: 'yt-RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa', thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg', duration: 229, source: 'youtube', videoId: 'RgKAFK5djSk' },
  { id: 'yt-YqeW9_5kURI', title: 'Uptown Funk', artist: 'Bruno Mars', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg', duration: 270, source: 'youtube', videoId: 'OPf0YbXqDm0' },
  { id: 'yt-pRpeEdMmmQ0', title: 'Shallow', artist: 'Lady Gaga & Bradley Cooper', thumbnail: 'https://i.ytimg.com/vi/bo_efYhYU2A/mqdefault.jpg', duration: 216, source: 'youtube', videoId: 'bo_efYhYU2A' },
]
