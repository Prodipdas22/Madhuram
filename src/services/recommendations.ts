import type { Song, ListeningStats } from '../types'
import { db } from './db'

export interface ScoredSong extends Song {
  score: number
}

// Scoring weights
const W = { playCount: 0.40, likes: 0.25, similarArtist: 0.20, trending: 0.15 }

export async function scoreAndRank(songs: Song[]): Promise<ScoredSong[]> {
  const allStats = await db.stats.toArray()
  const statsMap = new Map<string, ListeningStats>(allStats.map(s => [s.songId, s]))

  // compute max values for normalization
  const maxPlay = Math.max(1, ...allStats.map(s => s.playCount))
  const maxLike = Math.max(1, ...allStats.map(s => s.likeCount))

  // top artists by play count
  const artistPlays = new Map<string, number>()
  for (const s of allStats) {
    if (!s.artist) continue
    artistPlays.set(s.artist, (artistPlays.get(s.artist) ?? 0) + s.playCount)
  }
  const maxArtistPlay = Math.max(1, ...[...artistPlays.values()])

  return songs.map(song => {
    const stat = statsMap.get(song.id)
    const playNorm = stat ? stat.playCount / maxPlay : 0
    const likeNorm = stat ? stat.likeCount / maxLike : 0
    const artistScore = (artistPlays.get(song.artist) ?? 0) / maxArtistPlay
    const trendingScore = Math.random() * 0.3 // light randomness for discovery

    const score =
      playNorm * W.playCount +
      likeNorm * W.likes +
      artistScore * W.similarArtist +
      trendingScore * W.trending

    return { ...song, score }
  }).sort((a, b) => b.score - a.score)
}

export async function generateDailyMixes(allSongs: Song[]): Promise<Song[][]> {
  if (allSongs.length === 0) return [[], [], []]

  const allStats = await db.stats.toArray()
  const artistPlays = new Map<string, Song[]>()
  const genrePlays = new Map<string, Song[]>()

  // Group by artist
  for (const song of allSongs) {
    const stat = allStats.find(s => s.songId === song.id)
    if (!stat || stat.playCount === 0) continue
    if (!artistPlays.has(song.artist)) artistPlays.set(song.artist, [])
    artistPlays.get(song.artist)!.push(song)

    if (song.genre) {
      if (!genrePlays.has(song.genre)) genrePlays.set(song.genre, [])
      genrePlays.get(song.genre)!.push(song)
    }
  }

  const topArtists = [...artistPlays.entries()].sort((a, b) => b[1].length - a[1].length)
  const topGenres = [...genrePlays.entries()].sort((a, b) => b[1].length - a[1].length)

  const mix1 = shuffleArray(topArtists[0]?.[1] ?? allSongs.slice(0, 15)).slice(0, 15)
  const mix2 = shuffleArray(topGenres[0]?.[1] ?? allSongs.slice(0, 15)).slice(0, 15)
  const mix3 = shuffleArray([
    ...(topArtists[1]?.[1] ?? []),
    ...(topGenres[1]?.[1] ?? [])
  ]).slice(0, 15)

  return [
    mix1.length ? mix1 : shuffleArray(allSongs).slice(0, 15),
    mix2.length ? mix2 : shuffleArray(allSongs).slice(0, 15),
    mix3.length ? mix3 : shuffleArray(allSongs).slice(0, 15)
  ]
}

export async function generateDiscoverWeekly(allSongs: Song[]): Promise<Song[]> {
  // Remove already-played songs
  const allStats = await db.stats.toArray()
  const playedIds = new Set(allStats.filter(s => s.playCount > 0).map(s => s.songId))
  const unplayed = allSongs.filter(s => !playedIds.has(s.id))
  const scored = await scoreAndRank(unplayed.length > 30 ? unplayed : allSongs)
  return scored.slice(0, 30)
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
