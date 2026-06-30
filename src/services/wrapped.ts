import type { WrappedData } from '../types'
import { db, getTopSongs, getTopArtists, getTotalMinutes } from './db'
import { format } from 'date-fns'

export async function generateWrapped(year = new Date().getFullYear()): Promise<WrappedData> {
  const [topSongs, topArtists, totalMinutes] = await Promise.all([
    getTopSongs(10),
    getTopArtists(5),
    getTotalMinutes()
  ])

  // Genre distribution from stats
  const allStats = await db.stats.toArray()
  const genreMap = new Map<string, number>()
  for (const s of allStats) {
    if (!s.genre) continue
    genreMap.set(s.genre, (genreMap.get(s.genre) ?? 0) + s.playCount)
  }
  const favoriteGenre = [...genreMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Mixed'

  // Listening streak
  const daily = await db.daily.toArray()
  const dateSet = new Set(daily.map(d => d.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (dateSet.has(format(d, 'yyyy-MM-dd'))) streak++
    else break
  }

  // Monthly stats for current year
  const monthlyStats = daily.filter(d => d.date.startsWith(String(year)))

  // Yearly summary by month
  const yearlyMap = new Map<string, number>()
  for (const d of monthlyStats) {
    const month = d.date.slice(0, 7) // YYYY-MM
    yearlyMap.set(month, (yearlyMap.get(month) ?? 0) + d.minutesListened)
  }
  const yearlySummary = [...yearlyMap.entries()].sort().map(([month, minutes]) => ({
    month: format(new Date(month + '-01'), 'MMM'),
    minutes
  }))

  return {
    year,
    totalMinutes,
    topSongs,
    topArtists,
    favoriteGenre,
    listeningStreak: streak,
    monthlyStats,
    yearlySummary
  }
}
