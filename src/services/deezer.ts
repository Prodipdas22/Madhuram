/**
 * Deezer API — No API key required for basic use
 * Provides: search, 30s preview MP3, charts, artist info, genre browsing
 * CORS proxy required since Deezer blocks direct browser requests
 */
import type { Song } from '../types'

// Public CORS proxies — tried in order
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
]

const DEEZER_BASE = 'https://api.deezer.com'

async function deezerFetch(endpoint: string): Promise<any> {
  const url = `${DEEZER_BASE}${endpoint}`
  // Try direct first (works in some environments)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      if (!data.error) return data
    }
  } catch (_) {}

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxied = `${proxy}${encodeURIComponent(url)}`
      const res = await fetch(proxied, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const data = await res.json()
      if (data && !data.error) return data
    } catch (_) {}
  }
  return null
}

function mapTrack(t: DeezerTrack): Song {
  return {
    id: `dz-${t.id}`,
    title: t.title,
    artist: t.artist?.name ?? 'Unknown',
    thumbnail: t.album?.cover_medium ?? t.album?.cover ?? '',
    duration: t.duration ?? 0,
    source: 'deezer' as const,
    deezerId: t.id,
    previewUrl: t.preview,   // 30s MP3 — free, no key needed
    album: t.album?.title,
    genre: t.type,
  }
}

interface DeezerTrack {
  id: number
  title: string
  duration: number
  preview: string
  artist: { name: string; picture_medium?: string }
  album: { title: string; cover: string; cover_medium: string }
  type?: string
}

// ── Search ────────────────────────────────────────────────────────────
export async function searchDeezer(query: string, limit = 30): Promise<Song[]> {
  const data = await deezerFetch(`/search?q=${encodeURIComponent(query)}&limit=${limit}&output=json`)
  if (!data?.data) return []
  return (data.data as DeezerTrack[])
    .filter(t => t.preview) // only songs with preview audio
    .map(mapTrack)
}

// ── Charts by country ─────────────────────────────────────────────────
export async function getDeezerCharts(limit = 30): Promise<Song[]> {
  const data = await deezerFetch(`/chart/0/tracks?limit=${limit}`)
  if (!data?.data) return []
  return (data.data as DeezerTrack[]).filter(t => t.preview).map(mapTrack)
}

// ── Genre chart ───────────────────────────────────────────────────────
export async function getDeezerGenre(genreId: number, limit = 24): Promise<Song[]> {
  const data = await deezerFetch(`/chart/${genreId}/tracks?limit=${limit}`)
  if (!data?.data) return []
  return (data.data as DeezerTrack[]).filter(t => t.preview).map(mapTrack)
}

// ── Artist top tracks ─────────────────────────────────────────────────
export async function getDeezerArtistTracks(artistId: number, limit = 10): Promise<Song[]> {
  const data = await deezerFetch(`/artist/${artistId}/top?limit=${limit}`)
  if (!data?.data) return []
  return (data.data as DeezerTrack[]).filter(t => t.preview).map(mapTrack)
}

// ── Deezer genre IDs (official) ───────────────────────────────────────
export const DEEZER_GENRES: Record<string, number> = {
  'Pop':        132,
  'Rock':       152,
  'Hip-Hop':    116,
  'Electronic': 106,
  'R&B':        165,
  'Jazz':       129,
  'Classical':  98,
  'Latin':      197,
  'Reggae':     144,
  'Country':    84,
  'K-Pop':      113,
  'Bollywood':  122,
  'Lo-fi':      106,
  'Ambient':    106,
}
