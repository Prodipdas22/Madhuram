/**
 * Last.fm API — Free, requires API key (get at last.fm/api)
 * Provides: similar artists, top tracks, artist info, genre tags, charts
 * API key is stored in localStorage so users can add their own
 */
import type { ArtistInfo } from '../types'

const BASE = 'https://ws.audioscrobbler.com/2.0/'

// Key management — stored in localStorage
const KEY_STORAGE = 'madhuram_lastfm_key'

export function getLastFmKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? ''
}

export function setLastFmKey(key: string) {
  localStorage.setItem(KEY_STORAGE, key)
}

export function hasLastFmKey(): boolean {
  return !!getLastFmKey()
}

async function lfmFetch(params: Record<string, string>): Promise<any> {
  const key = getLastFmKey()
  if (!key) return null
  const qs = new URLSearchParams({
    ...params,
    api_key: key,
    format: 'json',
  })
  try {
    const res = await fetch(`${BASE}?${qs}`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    return data
  } catch (_) {
    return null
  }
}

// ── Top tracks globally ───────────────────────────────────────────────
export async function getTopTracks(limit = 30): Promise<{ title: string; artist: string }[]> {
  const data = await lfmFetch({ method: 'chart.gettoptracks', limit: String(limit) })
  return data?.tracks?.track?.map((t: any) => ({
    title: t.name,
    artist: t.artist.name,
  })) ?? []
}

// ── Top tracks by tag/genre ───────────────────────────────────────────
export async function getTracksByTag(tag: string, limit = 20): Promise<{ title: string; artist: string }[]> {
  const data = await lfmFetch({ method: 'tag.gettoptracks', tag, limit: String(limit) })
  return data?.tracks?.track?.map((t: any) => ({
    title: t.name,
    artist: t.artist.name,
  })) ?? []
}

// ── Similar artists ───────────────────────────────────────────────────
export async function getSimilarArtists(artist: string, limit = 6): Promise<string[]> {
  const data = await lfmFetch({ method: 'artist.getsimilar', artist, limit: String(limit) })
  return data?.similarartists?.artist?.map((a: any) => a.name) ?? []
}

// ── Artist info ───────────────────────────────────────────────────────
export async function getArtistInfo(artist: string): Promise<ArtistInfo | null> {
  const [info, similar] = await Promise.all([
    lfmFetch({ method: 'artist.getinfo', artist }),
    lfmFetch({ method: 'artist.getsimilar', artist, limit: '4' }),
  ])
  if (!info?.artist) return null
  const a = info.artist
  return {
    name: a.name,
    image: a.image?.find((i: any) => i.size === 'large')?.['#text'] || undefined,
    bio: a.bio?.summary?.replace(/<[^>]+>/g, '').split('Read more')[0].trim(),
    similar: similar?.similarartists?.artist?.map((s: any) => s.name) ?? [],
    tags: a.tags?.tag?.map((t: any) => t.name) ?? [],
    listeners: parseInt(a.stats?.listeners ?? '0'),
  }
}

// ── Artist top tracks ─────────────────────────────────────────────────
export async function getArtistTopTracks(artist: string, limit = 10): Promise<{ title: string; artist: string }[]> {
  const data = await lfmFetch({ method: 'artist.gettoptracks', artist, limit: String(limit) })
  return data?.toptracks?.track?.map((t: any) => ({
    title: t.name,
    artist,
  })) ?? []
}

// ── Track info ────────────────────────────────────────────────────────
export async function getTrackInfo(title: string, artist: string): Promise<{ tags: string[] } | null> {
  const data = await lfmFetch({ method: 'track.getinfo', track: title, artist })
  if (!data?.track) return null
  return {
    tags: data.track.toptags?.tag?.map((t: any) => t.name) ?? [],
  }
}

// ── Top artists globally ──────────────────────────────────────────────
export async function getTopArtistsGlobal(limit = 10): Promise<string[]> {
  const data = await lfmFetch({ method: 'chart.gettopartists', limit: String(limit) })
  return data?.artists?.artist?.map((a: any) => a.name) ?? []
}
