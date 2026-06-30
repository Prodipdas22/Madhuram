import Fuse from 'fuse.js'
import type { Song } from '../types'
import { db } from './db'
import { searchYouTube } from './youtube'
import { searchArchive } from './archive'
import { searchFMA } from './fma'
import { addSearchHistory } from './db'

const fuseOptions: Fuse.IFuseOptions<Song> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'artist', weight: 0.3 },
    { name: 'genre', weight: 0.2 }
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2
}

let fuse: Fuse<Song> | null = null
let cachedSongs: Song[] = []

export async function initSearch() {
  cachedSongs = await db.songs.toArray()
  fuse = new Fuse(cachedSongs, fuseOptions)
}

export async function localSearch(query: string): Promise<Song[]> {
  if (!fuse || query.length < 2) return []
  const results = fuse.search(query, { limit: 20 })
  return results.map(r => r.item)
}

export async function globalSearch(query: string, sources: ('youtube' | 'archive' | 'fma')[] = ['youtube', 'archive', 'fma']): Promise<Song[]> {
  if (!query.trim()) return []
  await addSearchHistory(query)

  const results = await Promise.allSettled([
    sources.includes('youtube') ? searchYouTube(query) : Promise.resolve([]),
    sources.includes('archive') ? searchArchive(query) : Promise.resolve([]),
    sources.includes('fma') ? searchFMA(query) : Promise.resolve([])
  ])

  const all: Song[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Merge local results first
  const local = await localSearch(query)
  const remote = all.filter(s => !local.find(l => l.id === s.id))

  return [...local, ...remote].slice(0, 50)
}

export function getAutocomplete(query: string, songs: Song[]): string[] {
  if (!query || query.length < 1) return []
  const f = new Fuse(songs, { keys: ['title', 'artist'], threshold: 0.3, minMatchCharLength: 1 })
  const results = f.search(query, { limit: 5 })
  return [...new Set(results.flatMap(r => [r.item.title, r.item.artist]))]
    .filter(s => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)
}
