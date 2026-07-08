/**
 * Unified Music API
 * Strategy:
 *   1. Deezer  → search + 30s real audio preview (no key, free)
 *   2. Last.fm → artist/genre metadata to build better search queries (free key)
 *   3. YouTube → full song playback via embed (free key or keyless Invidious)
 *
 * For each search:
 *   - Deezer returns real audio (30s previews) immediately
 *   - We also build YouTube equivalents so user can play full song
 *   - Last.fm enriches recommendations with similar artists
 */
import type { Song } from '../types'
import { searchDeezer, getDeezerCharts, getDeezerGenre, DEEZER_GENRES } from './deezer'
import { searchYouTube, getTrendingMusic, FALLBACK_POOL } from './youtube'
import { getTracksByTag, getSimilarArtists, getTopTracks, hasLastFmKey } from './lastfm'
import { shuffleArray } from './recommendations'

// ── Unified search ────────────────────────────────────────────────────
export async function unifiedSearch(query: string, limit = 30): Promise<Song[]> {
  const [deezer, youtube] = await Promise.allSettled([
    searchDeezer(query, limit),
    searchYouTube(query, Math.floor(limit / 2)),
  ])

  const deezerSongs = deezer.status === 'fulfilled' ? deezer.value : []
  const youtubeSongs = youtube.status === 'fulfilled' ? youtube.value : []

  // Deezer first (real audio), then YouTube (full songs), deduplicated by title+artist
  const seen = new Set<string>()
  const merged: Song[] = []

  for (const song of [...deezerSongs, ...youtubeSongs]) {
    const key = `${song.title.toLowerCase()}-${song.artist.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(song)
    }
  }

  return merged.slice(0, limit)
}

// ── Home: trending / featured ─────────────────────────────────────────
export async function getFeaturedSongs(): Promise<Song[]> {
  const [charts, trending] = await Promise.allSettled([
    getDeezerCharts(30),
    getTrendingMusic(),
  ])

  const deezerCharts = charts.status === 'fulfilled' ? charts.value : []
  const ytTrending = trending.status === 'fulfilled' ? trending.value : []

  // If Deezer works, prioritize it (real audio)
  if (deezerCharts.length >= 6) {
    return deezerCharts
  }

  // Mix YouTube trending + fallback
  const combined = [...ytTrending, ...shuffleArray(FALLBACK_POOL)]
  const seen = new Set<string>()
  return combined.filter(s => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  }).slice(0, 30)
}

// ── Genre browsing ────────────────────────────────────────────────────
export async function getSongsByGenre(genre: string): Promise<Song[]> {
  const results: Song[][] = []

  // Try Deezer genre charts first (best audio quality)
  const genreId = DEEZER_GENRES[genre]
  if (genreId) {
    const deezerGenre = await getDeezerGenre(genreId, 24).catch(() => [])
    if (deezerGenre.length >= 6) return deezerGenre
    results.push(deezerGenre)
  }

  // Last.fm tag → search queries → Deezer
  if (hasLastFmKey()) {
    try {
      const tracks = await getTracksByTag(genre.toLowerCase(), 10)
      if (tracks.length > 0) {
        const deezerResults = await Promise.allSettled(
          tracks.slice(0, 5).map(t => searchDeezer(`${t.title} ${t.artist}`, 3))
        )
        for (const r of deezerResults) {
          if (r.status === 'fulfilled') results.push(r.value)
        }
      }
    } catch (_) {}
  }

  // YouTube fallback
  const ytResults = await searchYouTube(`${genre} music`, 12).catch(() => [])
  results.push(ytResults)

  // Fallback pool filtered by genre
  const poolByGenre = shuffleArray(
    FALLBACK_POOL.filter(s => s.genre?.toLowerCase() === genre.toLowerCase())
  )
  results.push(poolByGenre)

  // Merge, deduplicate
  const seen = new Set<string>()
  const merged: Song[] = []
  for (const list of results) {
    for (const song of list) {
      if (!seen.has(song.id)) {
        seen.add(song.id)
        merged.push(song)
      }
    }
  }
  return merged.slice(0, 24)
}

// ── Mood search ───────────────────────────────────────────────────────
export async function getSongsByMood(query: string): Promise<Song[]> {
  const [deezer, youtube] = await Promise.allSettled([
    searchDeezer(query, 20),
    searchYouTube(query, 10),
  ])
  const songs = [
    ...(deezer.status === 'fulfilled' ? deezer.value : []),
    ...(youtube.status === 'fulfilled' ? youtube.value : []),
  ]
  return songs.length >= 4 ? songs : shuffleArray(FALLBACK_POOL).slice(0, 20)
}

// ── Recommendations using Last.fm similar artists ─────────────────────
export async function getRecommendedSongs(topArtists: string[]): Promise<Song[]> {
  if (!topArtists.length) return shuffleArray(FALLBACK_POOL).slice(0, 20)

  if (hasLastFmKey()) {
    try {
      // Get similar artists for top 2 played artists
      const similarResults = await Promise.allSettled(
        topArtists.slice(0, 2).map(a => getSimilarArtists(a, 4))
      )
      const similarArtists = similarResults
        .flatMap(r => r.status === 'fulfilled' ? r.value : [])
        .filter(a => !topArtists.includes(a))

      if (similarArtists.length > 0) {
        // Search Deezer for songs by similar artists
        const songResults = await Promise.allSettled(
          similarArtists.slice(0, 4).map(a => searchDeezer(a, 5))
        )
        const songs = songResults.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        if (songs.length >= 6) return shuffleArray(songs)
      }
    } catch (_) {}
  }

  // Fallback: search Deezer for top artists directly
  const results = await Promise.allSettled(
    topArtists.slice(0, 3).map(a => searchDeezer(a, 6))
  )
  const songs = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  return songs.length >= 4 ? shuffleArray(songs) : shuffleArray(FALLBACK_POOL).slice(0, 20)
}

// ── Discover Weekly using Last.fm global top tracks ───────────────────
export async function getDiscoverWeeklySongs(): Promise<Song[]> {
  if (hasLastFmKey()) {
    try {
      const topTracks = await getTopTracks(20)
      if (topTracks.length > 0) {
        const results = await Promise.allSettled(
          topTracks.slice(0, 8).map(t => searchDeezer(`${t.title} ${t.artist}`, 2))
        )
        const songs = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
        if (songs.length >= 10) return shuffleArray(songs).slice(0, 30)
      }
    } catch (_) {}
  }

  const charts = await getDeezerCharts(30).catch(() => [])
  return charts.length >= 10 ? shuffleArray(charts) : shuffleArray(FALLBACK_POOL)
}
