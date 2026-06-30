import { useEffect, useState } from 'react'
import { getHistory } from '../services/db'
import { SongRow } from '../components/ui/SongCard'
import { History } from 'lucide-react'
import type { Song } from '../types'

export default function HistoryPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory(100).then(s => { setSongs(s); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Listening History</h1>
      {loading && <div className="text-gray-400">Loading…</div>}
      {!loading && songs.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <History size={48} className="mx-auto mb-4 text-gray-700" />
          <p>Your listening history will appear here</p>
        </div>
      )}
      <div className="space-y-0.5">
        {songs.map((song, i) => (
          <SongRow key={`${song.id}-${i}`} song={song} queue={songs} index={i} showIndex />
        ))}
      </div>
    </div>
  )
}
