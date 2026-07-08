export type Source = 'youtube' | 'archive' | 'deezer'


export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
  genre?: string
  source: Source
  videoId?: string      // for youtube
  archiveId?: string    // for internet archive
  streamUrl?: string    // for fma / archive direct
  year?: number
  album?: string
  listenCount?: number
  likedAt?: number
}

export interface Playlist {
  id: string
  name: string
  songs: Song[]
  createdAt: number
  updatedAt: number
  description?: string
  coverUrl?: string
}

export interface ListeningStats {
  songId: string
  playCount: number
  likeCount: number
  repeatCount: number
  searchFrequency: number
  listeningDuration: number // seconds
  lastPlayed: number
  genre?: string
  artist?: string
}

export interface DailyStats {
  date: string // YYYY-MM-DD
  minutesListened: number
  songsPlayed: number
  topGenre?: string
}

export interface UserPreferences {
  theme: 'dark'
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
  crossfade: boolean
}

export interface SearchResult {
  songs: Song[]
  artists: string[]
  query: string
}

export interface QueueItem extends Song {
  queueId: string
}

export interface Artist {
  name: string
  thumbnail?: string
  playCount: number
  genres: string[]
}

export interface WrappedData {
  year: number
  totalMinutes: number
  topSongs: Song[]
  topArtists: Artist[]
  favoriteGenre: string
  listeningStreak: number
  monthlyStats: DailyStats[]
  yearlySummary: { month: string; minutes: number }[]
}
export interface Song {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
  genre?: string
  source: Source
  // YouTube
  videoId?: string
  // Deezer
  deezerId?: number
  previewUrl?: string   // 30s Deezer preview MP3
  album?: string
  // Archive
  archiveId?: string
  streamUrl?: string
  // Meta
  year?: number
  listenCount?: number
  likedAt?: number
}

export interface Playlist {
  id: string
  name: string
  songs: Song[]
  createdAt: number
  updatedAt: number
  description?: string
  coverUrl?: string
}

export interface ListeningStats {
  songId: string
  playCount: number
  likeCount: number
  repeatCount: number
  searchFrequency: number
  listeningDuration: number
  lastPlayed: number
  genre?: string
  artist?: string
}

export interface DailyStats {
  date: string
  minutesListened: number
  songsPlayed: number
  topGenre?: string
}

export interface UserPreferences {
  theme: 'dark'
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
}

export interface QueueItem extends Song {
  queueId: string
}

export interface Artist {
  name: string
  thumbnail?: string
  playCount: number
  genres: string[]
}

export interface WrappedData {
  year: number
  totalMinutes: number
  topSongs: Song[]
  topArtists: Artist[]
  favoriteGenre: string
  listeningStreak: number
  monthlyStats: DailyStats[]
  yearlySummary: { month: string; minutes: number }[]
}

export interface ArtistInfo {
  name: string
  image?: string
  bio?: string
  similar: string[]
  tags: string[]
  listeners?: number
}
