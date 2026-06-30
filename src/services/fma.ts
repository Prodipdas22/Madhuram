import type { Song } from '../types'

// FMA uses HTTPS API - no key needed for basic search
const FMA_BASE = 'https://freemusicarchive.org/api'

export async function searchFMA(query: string, limit = 20): Promise<Song[]> {
  try {
    const url = `${FMA_BASE}/get/tracks.json?search_term=${encodeURIComponent(query)}&limit=${limit}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const tracks: FMATrack[] = data?.dataset ?? []
    return tracks.map(t => ({
      id: `fma-${t.track_id}`,
      title: t.track_title ?? 'Unknown',
      artist: t.artist_name ?? 'Unknown Artist',
      thumbnail: t.track_image_file ?? `https://freemusicarchive.org/image/?file=images%2Fdefault%2Fsong.png`,
      duration: Number(t.track_duration) || 0,
      source: 'fma' as const,
      streamUrl: t.track_url,
      genre: t.track_genres?.[0]?.genre_title
    }))
  } catch {
    return []
  }
}

export async function getFMAGenres(): Promise<{ id: string; name: string }[]> {
  try {
    const res = await fetch(`${FMA_BASE}/get/genres.json`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return DEFAULT_GENRES
    const data = await res.json()
    return (data?.dataset ?? []).map((g: { genre_id: string; genre_title: string }) => ({
      id: g.genre_id,
      name: g.genre_title
    }))
  } catch {
    return DEFAULT_GENRES
  }
}

const DEFAULT_GENRES = [
  { id: '1', name: 'Pop' }, { id: '2', name: 'Rock' }, { id: '3', name: 'Hip-Hop' },
  { id: '4', name: 'Electronic' }, { id: '5', name: 'Jazz' }, { id: '6', name: 'Classical' },
  { id: '7', name: 'R&B' }, { id: '8', name: 'Country' }, { id: '9', name: 'Folk' },
  { id: '10', name: 'Ambient' }
]

interface FMATrack {
  track_id: string
  track_title?: string
  artist_name?: string
  track_image_file?: string
  track_duration?: string | number
  track_url?: string
  track_genres?: { genre_id: string; genre_title: string }[]
}
