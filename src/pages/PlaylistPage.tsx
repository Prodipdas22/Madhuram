import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Shuffle, MoreHorizontal, Edit2, Trash2, Copy, Download, Upload, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import {
  getPlaylist, updatePlaylist, deletePlaylist, duplicatePlaylist,
  reorderPlaylist, removeSongFromPlaylist, exportPlaylist, importPlaylist
} from '../services/playlist'
import { usePlayerStore } from '../store/player'
import { useUIStore } from '../store/ui'
import { useLibrary } from '../hooks/useLibrary'
import { generateGradient, formatDuration } from '../utils'
import type { Playlist, Song } from '../types'
import { shuffleArray } from '../services/recommendations'

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const { playSong } = usePlayerStore()
  const { notify } = useUIStore()
  const { refresh } = useLibrary()
  const fileRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const load = async () => {
    if (!id) return
    const pl = await getPlaylist(id)
    if (!pl) return
    setPlaylist(pl)
    setSongs(pl.songs)
  }

  useEffect(() => { load() }, [id])

  const handleRename = async () => {
    if (!id || !newName.trim()) return
    await updatePlaylist(id, { name: newName })
    setRenaming(false)
    await load()
    await refresh()
  }

  const handleDelete = async () => {
    if (!id) return
    await deletePlaylist(id)
    await refresh()
    notify('Playlist deleted')
    navigate('/library')
  }

  const handleDuplicate = async () => {
    if (!id) return
    const copy = await duplicatePlaylist(id)
    if (copy) { await refresh(); notify(`Duplicated as "${copy.name}"`) }
  }

  const handleExport = () => {
    if (!playlist) return
    const json = exportPlaylist(playlist)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${playlist.name}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const pl = await importPlaylist(text)
    if (pl) { await refresh(); notify(`Imported "${pl.name}"`); navigate(`/playlist/${pl.id}`) }
    else notify('Invalid playlist file', 'error')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !id) return
    const oldIdx = songs.findIndex(s => s.id === active.id)
    const newIdx = songs.findIndex(s => s.id === over.id)
    const reordered = arrayMove(songs, oldIdx, newIdx)
    setSongs(reordered)
    await reorderPlaylist(id, reordered)
  }

  const handleRemove = async (songId: string) => {
    if (!id) return
    await removeSongFromPlaylist(id, songId)
    setSongs(prev => prev.filter(s => s.id !== songId))
    notify('Removed from playlist')
  }

  if (!playlist) return (
    <div className="flex items-center justify-center py-32 text-gray-500">Loading playlist…</div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end gap-6 mb-8 p-6 rounded-2xl" style={{ background: generateGradient(playlist.name) }}>
        <div className="w-32 h-32 rounded-xl flex-shrink-0 overflow-hidden shadow-2xl" style={{ background: generateGradient(playlist.name + '2') }}>
          {songs[0] && <img src={songs[0].thumbnail} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Playlist</p>
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                className="text-3xl font-bold bg-transparent text-white border-b border-white outline-none w-full"
              />
              <button onClick={handleRename}><Check size={20} className="text-accent" /></button>
              <button onClick={() => setRenaming(false)}><X size={20} className="text-white/50" /></button>
            </div>
          ) : (
            <h1 className="text-4xl font-bold text-white truncate">{playlist.name}</h1>
          )}
          <p className="text-white/70 text-sm mt-1">{songs.length} songs</p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => songs[0] && playSong(songs[0], songs)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent text-black font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button
              onClick={() => { const s = shuffleArray(songs); s[0] && playSong(s[0], s) }}
              className="px-4 py-2.5 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              <Shuffle size={16} />
            </button>
            {/* Menu */}
            <div className="relative ml-auto">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-white/70 hover:text-white">
                <MoreHorizontal size={20} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-8 w-48 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10"
                  >
                    {[
                      { icon: Edit2, label: 'Rename', onClick: () => { setNewName(playlist.name); setRenaming(true); setMenuOpen(false) } },
                      { icon: Copy, label: 'Duplicate', onClick: () => { handleDuplicate(); setMenuOpen(false) } },
                      { icon: Download, label: 'Export JSON', onClick: () => { handleExport(); setMenuOpen(false) } },
                      { icon: Upload, label: 'Import JSON', onClick: () => { fileRef.current?.click(); setMenuOpen(false) } },
                      { icon: Trash2, label: 'Delete', onClick: handleDelete, danger: true },
                    ].map(item => (
                      <button key={item.label} onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${item.danger ? 'text-red-400' : 'text-gray-200'}`}>
                        <item.icon size={14} /> {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Song list with DnD */}
      {songs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">This playlist is empty. Search for songs to add.</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {songs.map((song, i) => (
                <SortableRow key={song.id} song={song} queue={songs} index={i} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

function SortableRow({ song, queue, index, onRemove }: { song: Song; queue: Song[]; index: number; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  const { playSong, currentSong } = usePlayerStore()
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const isCurrent = currentSong?.id === song.id

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
      <button {...attributes} {...listeners} className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1">
        <GripVertical size={14} />
      </button>
      <span className="w-5 text-center text-sm text-gray-500">{index + 1}</span>
      <img src={song.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0 cursor-pointer" onClick={() => playSong(song, queue)} />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playSong(song, queue)}>
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>{song.title}</p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-gray-400">{formatDuration(song.duration)}</span>
      <button onClick={() => onRemove(song.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1">
        <X size={14} />
      </button>
    </div>
  )
}
