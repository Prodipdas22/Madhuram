import type { Song } from '../types'

// ─── Invidious public instances (tried in random order) ─────────────
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.privacyredirect.com',
  'https://invidious.fdn.fr',
  'https://yt.cdaut.de',
  'https://invidious.tiekoetter.com',
  'https://iv.ggtyler.dev',
  'https://invidious.perennialte.ch',
  'https://invidious.darkness.services',
  'https://invidious.nerdvpn.de',
  'https://invidious.slipfox.xyz',
]

interface InvidiousVideo {
  videoId: string
  title: string
  author: string
  lengthSeconds: number
  videoThumbnails?: { quality: string; url: string }[]
}

function mapVideo(v: InvidiousVideo): Song {
  return {
    id: `yt-${v.videoId}`,
    title: v.title,
    artist: v.author,
    thumbnail:
      v.videoThumbnails?.find(t => t.quality === 'medium')?.url ??
      `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
    duration: v.lengthSeconds ?? 0,
    source: 'youtube' as const,
    videoId: v.videoId,
  }
}

async function invidiousFetch(path: string): Promise<any> {
  const shuffled = [...INVIDIOUS_INSTANCES].sort(() => Math.random() - 0.5)
  for (const instance of shuffled) {
    try {
      const res = await fetch(`${instance}${path}`, {
        signal: AbortSignal.timeout(6000),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (Array.isArray(data) ? data.length > 0 : !!data) return data
    } catch {
      // try next instance
    }
  }
  return null
}

// ── Public API search ──────────────────────────────────────────────
export async function searchYouTube(query: string, maxResults = 30): Promise<Song[]> {
  const path = `/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,videoThumbnails,lengthSeconds`
  const data = await invidiousFetch(path)
  if (!Array.isArray(data)) return []
  return data
    .filter((v: InvidiousVideo) => v.lengthSeconds > 60 && v.lengthSeconds < 1800)
    .slice(0, maxResults)
    .map(mapVideo)
}

export async function getTrendingMusic(): Promise<Song[]> {
  const data = await invidiousFetch('/api/v1/trending?type=music&fields=videoId,title,author,videoThumbnails,lengthSeconds')
  if (Array.isArray(data) && data.length > 0) return data.slice(0, 30).map(mapVideo)
  return shuffleArray([...FALLBACK_POOL]).slice(0, 24)
}

export async function searchYouTubeByGenre(genre: string): Promise<Song[]> {
  // First try live API
  const live = await searchYouTube(`${genre} music official audio`, 24)
  if (live.length >= 6) return live
  // Fallback: filter pool by genre, then fill with shuffled rest
  const byGenre = FALLBACK_POOL.filter(s => s.genre?.toLowerCase() === genre.toLowerCase())
  const rest = FALLBACK_POOL.filter(s => s.genre?.toLowerCase() !== genre.toLowerCase())
  return shuffleArray([...byGenre, ...shuffleArray(rest)]).slice(0, 20)
}

export async function searchYouTubeByMood(mood: string, query: string): Promise<Song[]> {
  const live = await searchYouTube(query, 24)
  if (live.length >= 6) return live
  return shuffleArray([...FALLBACK_POOL]).slice(0, 20)
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─────────────────────────────────────────────────────────────────────
// FALLBACK POOL — 200+ songs across 15 genres
// Used when all Invidious instances are down.
// Shuffled on every load so it never feels the same.
// ─────────────────────────────────────────────────────────────────────
export const FALLBACK_POOL: Song[] = [

  // ── POP ─────────────────────────────────────────────────────────
  { id: 'yt-JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg', duration: 234, source: 'youtube', videoId: 'JGwWNGJdvx8', genre: 'Pop' },
  { id: 'yt-dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 213, source: 'youtube', videoId: 'dQw4w9WgXcQ', genre: 'Pop' },
  { id: 'yt-kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg', duration: 282, source: 'youtube', videoId: 'kJQP7kiw5Fk', genre: 'Pop' },
  { id: 'yt-fRh_vgS2dFE', title: 'Sorry', artist: 'Justin Bieber', thumbnail: 'https://i.ytimg.com/vi/fRh_vgS2dFE/mqdefault.jpg', duration: 200, source: 'youtube', videoId: 'fRh_vgS2dFE', genre: 'Pop' },
  { id: 'yt-OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Bruno Mars', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg', duration: 270, source: 'youtube', videoId: 'OPf0YbXqDm0', genre: 'Pop' },
  { id: 'yt-09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg', duration: 235, source: 'youtube', videoId: '09R8_2nJtjg', genre: 'Pop' },
  { id: 'yt-hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg', duration: 257, source: 'youtube', videoId: 'hT_nvWreIhg', genre: 'Pop' },
  { id: 'yt-nfWlot6h_JM', title: 'Shake It Off', artist: 'Taylor Swift', thumbnail: 'https://i.ytimg.com/vi/nfWlot6h_JM/mqdefault.jpg', duration: 219, source: 'youtube', videoId: 'nfWlot6h_JM', genre: 'Pop' },
  { id: 'yt-ZbZSe6N_BXs', title: 'Happy', artist: 'Pharrell Williams', thumbnail: 'https://i.ytimg.com/vi/ZbZSe6N_BXs/mqdefault.jpg', duration: 233, source: 'youtube', videoId: 'ZbZSe6N_BXs', genre: 'Pop' },
  { id: 'yt-hLQl3WQQoQ0', title: 'Someone Like You', artist: 'Adele', thumbnail: 'https://i.ytimg.com/vi/hLQl3WQQoQ0/mqdefault.jpg', duration: 285, source: 'youtube', videoId: 'hLQl3WQQoQ0', genre: 'Pop' },
  { id: 'yt-ru0K8uLPGMM', title: 'Hello', artist: 'Adele', thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg', duration: 295, source: 'youtube', videoId: 'YQHsXMglC9A', genre: 'Pop' },
  { id: 'yt-CevxZvSJLk8', title: 'Stressed Out', artist: 'Twenty One Pilots', thumbnail: 'https://i.ytimg.com/vi/pXRviuL6vMY/mqdefault.jpg', duration: 202, source: 'youtube', videoId: 'pXRviuL6vMY', genre: 'Pop' },
  { id: 'yt-7PCkvCPvDXk', title: 'Bad Guy', artist: 'Billie Eilish', thumbnail: 'https://i.ytimg.com/vi/DyDfgMOUjCI/mqdefault.jpg', duration: 194, source: 'youtube', videoId: 'DyDfgMOUjCI', genre: 'Pop' },
  { id: 'yt-TUVcZfQe', title: 'Levitating', artist: 'Dua Lipa', thumbnail: 'https://i.ytimg.com/vi/TUVcZfQeQ4E/mqdefault.jpg', duration: 203, source: 'youtube', videoId: 'TUVcZfQeQ4E', genre: 'Pop' },
  { id: 'yt-bs0STXBSG', title: 'As It Was', artist: 'Harry Styles', thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/mqdefault.jpg', duration: 167, source: 'youtube', videoId: 'H5v3kku4y6Q', genre: 'Pop' },
  { id: 'yt-FkUUs', title: 'Anti-Hero', artist: 'Taylor Swift', thumbnail: 'https://i.ytimg.com/vi/b1kbLwvqugk/mqdefault.jpg', duration: 200, source: 'youtube', videoId: 'b1kbLwvqugk', genre: 'Pop' },
  { id: 'yt-uelHwf8', title: 'Stay With Me', artist: 'Sam Smith', thumbnail: 'https://i.ytimg.com/vi/pB-5XG-DbAA/mqdefault.jpg', duration: 172, source: 'youtube', videoId: 'pB-5XG-DbAA', genre: 'Pop' },
  { id: 'yt-60ItHLz5WEA', title: 'Animals', artist: 'Martin Garrix', thumbnail: 'https://i.ytimg.com/vi/gCYcHz2k5x0/mqdefault.jpg', duration: 208, source: 'youtube', videoId: 'gCYcHz2k5x0', genre: 'Electronic' },
  { id: 'yt-KQ6zr6kCPj8', title: 'Roar', artist: 'Katy Perry', thumbnail: 'https://i.ytimg.com/vi/CevxZvSJLk8/mqdefault.jpg', duration: 224, source: 'youtube', videoId: 'CevxZvSJLk8', genre: 'Pop' },
  { id: 'yt-QGJuMBdaqIw', title: 'Firework', artist: 'Katy Perry', thumbnail: 'https://i.ytimg.com/vi/QGJuMBdaqIw/mqdefault.jpg', duration: 228, source: 'youtube', videoId: 'QGJuMBdaqIw', genre: 'Pop' },

  // ── BOLLYWOOD ────────────────────────────────────────────────────
  { id: 'yt-MrChc7R3ZgI', title: 'Kesariya', artist: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/MrChc7R3ZgI/mqdefault.jpg', duration: 270, source: 'youtube', videoId: 'MrChc7R3ZgI', genre: 'Bollywood' },
  { id: 'yt-Umqb9KENgmk', title: 'Tum Hi Ho', artist: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/Umqb9KENgmk/mqdefault.jpg', duration: 261, source: 'youtube', videoId: 'Umqb9KENgmk', genre: 'Bollywood' },
  { id: 'yt-poeHeiMjFos', title: 'Kal Ho Naa Ho', artist: 'Sonu Nigam', thumbnail: 'https://i.ytimg.com/vi/poeHeiMjFos/mqdefault.jpg', duration: 298, source: 'youtube', videoId: 'poeHeiMjFos', genre: 'Bollywood' },
  { id: 'yt-sVABMBMBWoA', title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', thumbnail: 'https://i.ytimg.com/vi/sVABMBMBWoA/mqdefault.jpg', duration: 207, source: 'youtube', videoId: 'sVABMBMBWoA', genre: 'Bollywood' },
  { id: 'yt-gRK6mEKBSoA', title: 'Apna Bana Le', artist: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/gRK6mEKBSoA/mqdefault.jpg', duration: 280, source: 'youtube', videoId: 'gRK6mEKBSoA', genre: 'Bollywood' },
  { id: 'yt-iik25wqIuFo', title: 'Chaleya', artist: 'Arijit Singh & Shilpa Rao', thumbnail: 'https://i.ytimg.com/vi/iik25wqIuFo/mqdefault.jpg', duration: 214, source: 'youtube', videoId: 'iik25wqIuFo', genre: 'Bollywood' },
  { id: 'yt-FoMBGIyIi_Y', title: 'Tere Bina', artist: 'AR Rahman', thumbnail: 'https://i.ytimg.com/vi/FoMBGIyIi_Y/mqdefault.jpg', duration: 313, source: 'youtube', videoId: 'FoMBGIyIi_Y', genre: 'Bollywood' },
  { id: 'yt-8U7NHCBTmr4', title: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh', thumbnail: 'https://i.ytimg.com/vi/8U7NHCBTmr4/mqdefault.jpg', duration: 345, source: 'youtube', videoId: '8U7NHCBTmr4', genre: 'Bollywood' },
  { id: 'yt-5NPqHBKwxVA', title: 'Jai Ho', artist: 'AR Rahman', thumbnail: 'https://i.ytimg.com/vi/5NPqHBKwxVA/mqdefault.jpg', duration: 295, source: 'youtube', videoId: '5NPqHBKwxVA', genre: 'Bollywood' },
  { id: 'yt-Bd5BDMoHJbs', title: 'Dil Dhadakne Do', artist: 'Shankar Ehsaan Loy', thumbnail: 'https://i.ytimg.com/vi/Bd5BDMoHJbs/mqdefault.jpg', duration: 280, source: 'youtube', videoId: 'Bd5BDMoHJbs', genre: 'Bollywood' },
  { id: 'yt-e8MKXhDM_dk', title: 'Galliyan', artist: 'Ankit Tiwari', thumbnail: 'https://i.ytimg.com/vi/e8MKXhDM_dk/mqdefault.jpg', duration: 268, source: 'youtube', videoId: 'e8MKXhDM_dk', genre: 'Bollywood' },
  { id: 'yt-YBGdLireT1s', title: 'Kun Faya Kun', artist: 'AR Rahman', thumbnail: 'https://i.ytimg.com/vi/YBGdLireT1s/mqdefault.jpg', duration: 473, source: 'youtube', videoId: 'YBGdLireT1s', genre: 'Bollywood' },
  { id: 'yt-Fp7S4TiPKtw', title: 'Phir Le Aya Dil', artist: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/Fp7S4TiPKtw/mqdefault.jpg', duration: 269, source: 'youtube', videoId: 'Fp7S4TiPKtw', genre: 'Bollywood' },
  { id: 'yt-xMMOhMOBNaU', title: 'Kabira', artist: 'Rekha Bhardwaj & Tochi Raina', thumbnail: 'https://i.ytimg.com/vi/xMMOhMOBNaU/mqdefault.jpg', duration: 237, source: 'youtube', videoId: 'xMMOhMOBNaU', genre: 'Bollywood' },
  { id: 'yt-NVEEUFCgpOI', title: 'Enna Sona', artist: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/NVEEUFCgpOI/mqdefault.jpg', duration: 253, source: 'youtube', videoId: 'NVEEUFCgpOI', genre: 'Bollywood' },
  { id: 'yt-WNIPqafd4As', title: 'Dil Chahta Hai', artist: 'Shankar Ehsaan Loy', thumbnail: 'https://i.ytimg.com/vi/WNIPqafd4As/mqdefault.jpg', duration: 298, source: 'youtube', videoId: 'WNIPqafd4As', genre: 'Bollywood' },
  { id: 'yt-3HtEPxBJB2s', title: 'Moh Moh Ke Dhaage', artist: 'Papon', thumbnail: 'https://i.ytimg.com/vi/3HtEPxBJB2s/mqdefault.jpg', duration: 287, source: 'youtube', videoId: '3HtEPxBJB2s', genre: 'Bollywood' },
  { id: 'yt-MMMp0DEzFto', title: 'Teri Mitti', artist: 'B Praak', thumbnail: 'https://i.ytimg.com/vi/MMMp0DEzFto/mqdefault.jpg', duration: 248, source: 'youtube', videoId: 'MMMp0DEzFto', genre: 'Bollywood' },
  { id: 'yt-3fQMRYxPAiU', title: 'Hawayein', artist: 'Arijit Singh', thumbnail: 'https://i.ytimg.com/vi/3fQMRYxPAiU/mqdefault.jpg', duration: 279, source: 'youtube', videoId: '3fQMRYxPAiU', genre: 'Bollywood' },
  { id: 'yt-BddP6PYo2gs', title: 'Main Rang Sharbaton Ka', artist: 'Atif Aslam', thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/mqdefault.jpg', duration: 290, source: 'youtube', videoId: 'BddP6PYo2gs', genre: 'Bollywood' },

  // ── HIP-HOP / RAP ────────────────────────────────────────────────
  { id: 'yt-RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg', duration: 229, source: 'youtube', videoId: 'RgKAFK5djSk', genre: 'Hip-Hop' },
  { id: 'yt-tvTRZJ-4EyI', title: 'HUMBLE.', artist: 'Kendrick Lamar', thumbnail: 'https://i.ytimg.com/vi/tvTRZJ-4EyI/mqdefault.jpg', duration: 177, source: 'youtube', videoId: 'tvTRZJ-4EyI', genre: 'Hip-Hop' },
  { id: 'yt-xpVfcZ0ZcFM', title: "God's Plan", artist: 'Drake', thumbnail: 'https://i.ytimg.com/vi/xpVfcZ0ZcFM/mqdefault.jpg', duration: 198, source: 'youtube', videoId: 'xpVfcZ0ZcFM', genre: 'Hip-Hop' },
  { id: 'yt-SC4xMk98Pdc', title: 'Sicko Mode', artist: 'Travis Scott', thumbnail: 'https://i.ytimg.com/vi/6ONRf7h3Mdk/mqdefault.jpg', duration: 312, source: 'youtube', videoId: '6ONRf7h3Mdk', genre: 'Hip-Hop' },
  { id: 'yt-9bZkp7q19f0', title: 'Gangnam Style', artist: 'PSY', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg', duration: 252, source: 'youtube', videoId: '9bZkp7q19f0', genre: 'Hip-Hop' },
  { id: 'yt-nCkpzqqog4k', title: 'Sunflower', artist: 'Post Malone & Swae Lee', thumbnail: 'https://i.ytimg.com/vi/ApXoWvfEYVU/mqdefault.jpg', duration: 158, source: 'youtube', videoId: 'ApXoWvfEYVU', genre: 'Hip-Hop' },
  { id: 'yt-IJKMFm4QVZI', title: 'Rockstar', artist: 'Post Malone ft. 21 Savage', thumbnail: 'https://i.ytimg.com/vi/UceaB4D0jpo/mqdefault.jpg', duration: 218, source: 'youtube', videoId: 'UceaB4D0jpo', genre: 'Hip-Hop' },
  { id: 'yt-n1WpP7iowLc', title: 'Eminem - Lose Yourself', artist: 'Eminem', thumbnail: 'https://i.ytimg.com/vi/xFYQQPAOz7Y/mqdefault.jpg', duration: 326, source: 'youtube', videoId: 'xFYQQPAOz7Y', genre: 'Hip-Hop' },
  { id: 'yt-IQKorMn5-MQ', title: 'In Da Club', artist: '50 Cent', thumbnail: 'https://i.ytimg.com/vi/5qm8PH4xAss/mqdefault.jpg', duration: 233, source: 'youtube', videoId: '5qm8PH4xAss', genre: 'Hip-Hop' },
  { id: 'yt-kcMF6EMjXn8', title: 'Nonstop', artist: 'Drake', thumbnail: 'https://i.ytimg.com/vi/kcMF6EMjXn8/mqdefault.jpg', duration: 228, source: 'youtube', videoId: 'kcMF6EMjXn8', genre: 'Hip-Hop' },

  // ── R&B / SOUL ───────────────────────────────────────────────────
  { id: 'yt-4NRXx6poskQ', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/4NRXx6poskQ/mqdefault.jpg', duration: 200, source: 'youtube', videoId: '4NRXx6poskQ', genre: 'R&B' },
  { id: 'yt-bo_efYhYU2A', title: 'Shallow', artist: 'Lady Gaga & Bradley Cooper', thumbnail: 'https://i.ytimg.com/vi/bo_efYhYU2A/mqdefault.jpg', duration: 216, source: 'youtube', videoId: 'bo_efYhYU2A', genre: 'R&B' },
  { id: 'yt-fWNaR-rxAic', title: "Can't Feel My Face", artist: 'The Weeknd', thumbnail: 'https://i.ytimg.com/vi/KEI4qSrkPAs/mqdefault.jpg', duration: 213, source: 'youtube', videoId: 'KEI4qSrkPAs', genre: 'R&B' },
  { id: 'yt-es87hJD4bMU', title: 'No Scrubs', artist: 'TLC', thumbnail: 'https://i.ytimg.com/vi/FrLequ6dUdM/mqdefault.jpg', duration: 214, source: 'youtube', videoId: 'FrLequ6dUdM', genre: 'R&B' },
  { id: 'yt-iS1g8G_NkI0', title: 'Ex Factor', artist: 'Lauryn Hill', thumbnail: 'https://i.ytimg.com/vi/iS1g8G_NkI0/mqdefault.jpg', duration: 302, source: 'youtube', videoId: 'iS1g8G_NkI0', genre: 'R&B' },
  { id: 'yt-0NHkFCd2AwQ', title: 'Golden', artist: 'Jill Scott', thumbnail: 'https://i.ytimg.com/vi/0NHkFCd2AwQ/mqdefault.jpg', duration: 252, source: 'youtube', videoId: '0NHkFCd2AwQ', genre: 'R&B' },

  // ── ROCK ─────────────────────────────────────────────────────────
  { id: 'yt-fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg', duration: 354, source: 'youtube', videoId: 'fJ9rUzIMcZQ', genre: 'Rock' },
  { id: 'yt-1w7OgIMMRc4', title: "Sweet Child O' Mine", artist: "Guns N' Roses", thumbnail: 'https://i.ytimg.com/vi/1w7OgIMMRc4/mqdefault.jpg', duration: 356, source: 'youtube', videoId: '1w7OgIMMRc4', genre: 'Rock' },
  { id: 'yt-hYkAjupQJHE', title: 'Smells Like Teen Spirit', artist: 'Nirvana', thumbnail: 'https://i.ytimg.com/vi/hTWKbfoikeg/mqdefault.jpg', duration: 301, source: 'youtube', videoId: 'hTWKbfoikeg', genre: 'Rock' },
  { id: 'yt-XWGhEMKuf4Y', title: 'Hotel California', artist: 'Eagles', thumbnail: 'https://i.ytimg.com/vi/BciS5krYL80/mqdefault.jpg', duration: 391, source: 'youtube', videoId: 'BciS5krYL80', genre: 'Rock' },
  { id: 'yt-v2AC41dglnM', title: 'Back In Black', artist: 'AC/DC', thumbnail: 'https://i.ytimg.com/vi/pAgnJDJN4VA/mqdefault.jpg', duration: 255, source: 'youtube', videoId: 'pAgnJDJN4VA', genre: 'Rock' },
  { id: 'yt-Tnu2EOcMbQk', title: 'Stairway to Heaven', artist: 'Led Zeppelin', thumbnail: 'https://i.ytimg.com/vi/QkF3oxziUI4/mqdefault.jpg', duration: 482, source: 'youtube', videoId: 'QkF3oxziUI4', genre: 'Rock' },
  { id: 'yt-qHJOLbRtHEg', title: 'Eye of the Tiger', artist: 'Survivor', thumbnail: 'https://i.ytimg.com/vi/btPJPFnesV4/mqdefault.jpg', duration: 245, source: 'youtube', videoId: 'btPJPFnesV4', genre: 'Rock' },
  { id: 'yt-I_izvAbhExY', title: 'Believer', artist: 'Imagine Dragons', thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/mqdefault.jpg', duration: 204, source: 'youtube', videoId: '7wtfhZwyrcc', genre: 'Rock' },
  { id: 'yt-mWRsgZuwf_8', title: 'Thunder', artist: 'Imagine Dragons', thumbnail: 'https://i.ytimg.com/vi/fKopy74weus/mqdefault.jpg', duration: 187, source: 'youtube', videoId: 'fKopy74weus', genre: 'Rock' },
  { id: 'yt-SBjQ9tuuTJQ', title: 'Radioactive', artist: 'Imagine Dragons', thumbnail: 'https://i.ytimg.com/vi/ktvTqknDobU/mqdefault.jpg', duration: 187, source: 'youtube', videoId: 'ktvTqknDobU', genre: 'Rock' },

  // ── ELECTRONIC / EDM ─────────────────────────────────────────────
  { id: 'yt-YqeW9_5kURI', title: 'Lean On', artist: 'Major Lazer & DJ Snake', thumbnail: 'https://i.ytimg.com/vi/YqeW9_5kURI/mqdefault.jpg', duration: 176, source: 'youtube', videoId: 'YqeW9_5kURI', genre: 'Electronic' },
  { id: 'yt-WA4iX5D9Z64', title: 'Roses', artist: 'SAINt JHN', thumbnail: 'https://i.ytimg.com/vi/WA4iX5D9Z64/mqdefault.jpg', duration: 176, source: 'youtube', videoId: 'WA4iX5D9Z64', genre: 'Electronic' },
  { id: 'yt-h5EofwRzit0', title: 'The Middle', artist: 'Zedd, Maren Morris & Grey', thumbnail: 'https://i.ytimg.com/vi/h5EofwRzit0/mqdefault.jpg', duration: 194, source: 'youtube', videoId: 'h5EofwRzit0', genre: 'Electronic' },
  { id: 'yt-PT2_F-1esPk', title: 'Titanium', artist: 'David Guetta ft. Sia', thumbnail: 'https://i.ytimg.com/vi/JRfuAukYTKg/mqdefault.jpg', duration: 245, source: 'youtube', videoId: 'JRfuAukYTKg', genre: 'Electronic' },
  { id: 'yt-72UO0y6TA8w', title: 'Levels', artist: 'Avicii', thumbnail: 'https://i.ytimg.com/vi/_ovdm2yX4MA/mqdefault.jpg', duration: 203, source: 'youtube', videoId: '_ovdm2yX4MA', genre: 'Electronic' },
  { id: 'yt-IcrbM1l_BoI', title: 'Wake Me Up', artist: 'Avicii', thumbnail: 'https://i.ytimg.com/vi/IcrbM1l_BoI/mqdefault.jpg', duration: 251, source: 'youtube', videoId: 'IcrbM1l_BoI', genre: 'Electronic' },
  { id: 'yt-1AqSBRtRj8', title: 'Clarity', artist: 'Zedd ft. Foxes', thumbnail: 'https://i.ytimg.com/vi/IxxstCcJlsc/mqdefault.jpg', duration: 271, source: 'youtube', videoId: 'IxxstCcJlsc', genre: 'Electronic' },
  { id: 'yt-gNi_6U5Pm_o', title: 'Faded', artist: 'Alan Walker', thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/mqdefault.jpg', duration: 212, source: 'youtube', videoId: '60ItHLz5WEA', genre: 'Electronic' },
  { id: 'yt-Q9ZAhHWNLb8', title: 'Spectre', artist: 'Alan Walker', thumbnail: 'https://i.ytimg.com/vi/AOeY-nDp7hI/mqdefault.jpg', duration: 227, source: 'youtube', videoId: 'AOeY-nDp7hI', genre: 'Electr
