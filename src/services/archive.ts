import type { Song } from '../types'

const BASE = 'https://archive.org'

export async function searchArchive(query: string, rows = 20): Promise<Song[]> {
  try {
    const url = `${BASE}/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:audio&fl[]=identifier,title,creator,length,subject&rows=${rows}&output=json`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const docs = data?.response?.docs ?? []
    return docs.map((d: ArchiveDoc) => ({
      id: `arc-${d.identifier}`,
      title: d.title ?? d.identifier,
      artist: Array.isArray(d.creator) ? d.creator[0] : (d.creator ?? 'Unknown Artist'),
      thumbnail: `${BASE}/services/img/${d.identifier}`,
      duration: parseDuration(d.length),
      source: 'archive' as const,
      archiveId: d.identifier,
      genre: Array.isArray(d.subject) ? d.subject[0] : d.subject
    }))
  } catch {
    return []
  }
}

export async function getArchiveStreamUrl(archiveId: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/metadata/${archiveId}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    const files: ArchiveFile[] = data?.files ?? []
    const audio = files.find(f => /\.(mp3|ogg|flac|wav)$/i.test(f.name) && f.source !== 'metadata')
    if (!audio) return null
    return `${BASE}/download/${archiveId}/${audio.name}`
  } catch {
    return null
  }
}

interface ArchiveDoc {
  identifier: string
  title?: string
  creator?: string | string[]
  length?: string
  subject?: string | string[]
}

interface ArchiveFile {
  name: string
  source: string
  format?: string
}

function parseDuration(length?: string): number {
  if (!length) return 0
  const parts = length.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return Math.floor(Number(length)) || 0
}
