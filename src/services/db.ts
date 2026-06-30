import Dexie, { Table } from 'dexie'
import type { Song, Playlist, ListeningStats, DailyStats } from '../types'

export class MadhuramDB extends Dexie {
  songs!: Table<Song>
  playlists!: Table<Playlist>
  stats!: Table<ListeningStats>
  daily!: Table<DailyStats>
  history!: Table<{ id: string; song: Song; playedAt: number }>
  searchHistory!: Table<{ id: string; query: string; at: number }>

  constructor() {
    super('MadhuramDB')
    this.version(1).stores({
      songs: 'id, title, artist, genre, source, listenCount',
      playlists: 'id, name, createdAt',
      stats: 'songId, playCount, lastPlayed, artist, genre',
      daily: 'date',
      history: '++id, [song.id+playedAt], playedAt',
      searchHistory: '++id, query, at'
    })
  }
}

export const db = new MadhuramDB()

// ─── helpers ────────────────────────────────────────────────

export async function recordPlay(song: Song, durationSec: number) {
  const now = Date.now()

  // update stats
  const existing = await db.stats.get(song.id)
  if (existing) {
    await db.stats.update(song.id, {
      playCount: existing.playCount + 1,
      listeningDuration: existing.listeningDuration + durationSec,
      lastPlayed: now,
      artist: song.artist,
      genre: song.genre
    })
  } else {
    await db.stats.put({
      songId: song.id,
      playCount: 1,
      likeCount: 0,
      repeatCount: 0,
      searchFrequency: 0,
      listeningDuration: durationSec,
      lastPlayed: now,
      artist: song.artist,
      genre: song.genre
    })
  }

  // cache song metadata
  await db.songs.put({ ...song, listenCount: (existing?.playCount ?? 0) + 1 })

  // history
  await db.history.add({ id: `${song.id}-${now}`, song, playedAt: now })

  // daily stats
  const dateStr = new Date().toISOString().slice(0, 10)
  const daily = await db.daily.get(dateStr)
  if (daily) {
    await db.daily.update(dateStr, {
      minutesListened: daily.minutesListened + Math.floor(durationSec / 60),
      songsPlayed: daily.songsPlayed + 1
    })
  } else {
    await db.daily.put({ date: dateStr, minutesListened: Math.floor(durationSec / 60), songsPlayed: 1 })
  }
}

export async function getTopSongs(limit = 20): Promise<Song[]> {
  const stats = await db.stats.orderBy('playCount').reverse().limit(limit).toArray()
  const songs: Song[] = []
  for (const s of stats) {
    const song = await db.songs.get(s.songId)
    if (song) songs.push(song)
  }
  return songs
}

export async function getTopArtists(limit = 10) {
  const stats = await db.stats.toArray()
  const artistMap = new Map<string, number>()
  for (const s of stats) {
    if (!s.artist) continue
    artistMap.set(s.artist, (artistMap.get(s.artist) ?? 0) + s.playCount)
  }
  return [...artistMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, playCount]) => ({ name, playCount, genres: [], thumbnail: undefined }))
}

export async function getHistory(limit = 50): Promise<Song[]> {
  const records = await db.history.orderBy('playedAt').reverse().limit(limit).toArray()
  return records.map(r => r.song)
}

export async function addSearchHistory(query: string) {
  if (!query.trim()) return
  await db.searchHistory.add({ id: `${query}-${Date.now()}`, query, at: Date.now() })
}

export async function getSearchHistory(limit = 10): Promise<string[]> {
  const records = await db.searchHistory.orderBy('at').reverse().limit(limit).toArray()
  return [...new Set(records.map(r => r.query))]
}

export async function getTotalMinutes(): Promise<number> {
  const daily = await db.daily.toArray()
  return daily.reduce((sum, d) => sum + d.minutesListened, 0)
}
