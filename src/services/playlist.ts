import { db } from './db'
import type { Playlist, Song } from '../types'

function uid() {
  return `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export async function createPlaylist(name: string, songs: Song[] = []): Promise<Playlist> {
  const pl: Playlist = { id: uid(), name, songs, createdAt: Date.now(), updatedAt: Date.now() }
  await db.playlists.put(pl)
  return pl
}

export async function getPlaylists(): Promise<Playlist[]> {
  return db.playlists.orderBy('createdAt').reverse().toArray()
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  return db.playlists.get(id)
}

export async function updatePlaylist(id: string, patch: Partial<Pick<Playlist, 'name' | 'songs' | 'description'>>) {
  await db.playlists.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deletePlaylist(id: string) {
  await db.playlists.delete(id)
}

export async function duplicatePlaylist(id: string): Promise<Playlist | null> {
  const original = await db.playlists.get(id)
  if (!original) return null
  const copy: Playlist = { ...original, id: uid(), name: `${original.name} (copy)`, createdAt: Date.now(), updatedAt: Date.now() }
  await db.playlists.put(copy)
  return copy
}

export async function addSongToPlaylist(playlistId: string, song: Song) {
  const pl = await db.playlists.get(playlistId)
  if (!pl) return
  if (pl.songs.find(s => s.id === song.id)) return // no duplicates
  await db.playlists.update(playlistId, { songs: [...pl.songs, song], updatedAt: Date.now() })
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  const pl = await db.playlists.get(playlistId)
  if (!pl) return
  await db.playlists.update(playlistId, { songs: pl.songs.filter(s => s.id !== songId), updatedAt: Date.now() })
}

export async function reorderPlaylist(playlistId: string, songs: Song[]) {
  await db.playlists.update(playlistId, { songs, updatedAt: Date.now() })
}

// Liked songs stored as special playlist
const LIKED_ID = 'liked-songs'

export async function ensureLiked() {
  const existing = await db.playlists.get(LIKED_ID)
  if (!existing) {
    await db.playlists.put({ id: LIKED_ID, name: 'Liked Songs', songs: [], createdAt: 0, updatedAt: Date.now() })
  }
}

export async function toggleLike(song: Song): Promise<boolean> {
  await ensureLiked()
  const pl = await db.playlists.get(LIKED_ID)
  if (!pl) return false
  const isLiked = !!pl.songs.find(s => s.id === song.id)
  if (isLiked) {
    await db.playlists.update(LIKED_ID, { songs: pl.songs.filter(s => s.id !== song.id), updatedAt: Date.now() })
    const stat = await db.stats.get(song.id)
    if (stat) await db.stats.update(song.id, { likeCount: Math.max(0, stat.likeCount - 1) })
  } else {
    await db.playlists.update(LIKED_ID, { songs: [...pl.songs, song], updatedAt: Date.now() })
    const stat = await db.stats.get(song.id)
    if (stat) await db.stats.update(song.id, { likeCount: stat.likeCount + 1 })
    else await db.stats.put({ songId: song.id, playCount: 0, likeCount: 1, repeatCount: 0, searchFrequency: 0, listeningDuration: 0, lastPlayed: 0, artist: song.artist, genre: song.genre })
  }
  return !isLiked
}

export async function isLiked(songId: string): Promise<boolean> {
  const pl = await db.playlists.get(LIKED_ID)
  return !!pl?.songs.find(s => s.id === songId)
}

export async function getLikedSongs(): Promise<Song[]> {
  await ensureLiked()
  const pl = await db.playlists.get(LIKED_ID)
  return pl?.songs ?? []
}

// JSON export/import
export function exportPlaylist(pl: Playlist): string {
  return JSON.stringify(pl, null, 2)
}

export async function importPlaylist(json: string): Promise<Playlist | null> {
  try {
    const pl = JSON.parse(json) as Playlist
    const imported: Playlist = { ...pl, id: uid(), name: `${pl.name} (imported)`, createdAt: Date.now(), updatedAt: Date.now() }
    await db.playlists.put(imported)
    return imported
  } catch {
    return null
  }
}
