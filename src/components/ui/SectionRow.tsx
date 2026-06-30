import { useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Song } from '../../types'
import { SongCard } from './SongCard'

interface SectionRowProps {
  title: string
  songs: Song[]
  viewAllTo?: string
  loading?: boolean
}

export function SectionRow({ title, songs, viewAllTo, loading }: SectionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return (
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 animate-pulse">
              <div className="aspect-square rounded-t-xl bg-white/10" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!songs.length) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {songs.slice(0, 6).map((song, i) => (
          <SongCard key={song.id} song={song} queue={songs} index={i} />
        ))}
      </div>
    </section>
  )
}
