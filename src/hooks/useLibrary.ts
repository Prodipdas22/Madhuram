import { useEffect } from 'react'
import { useLibraryStore } from '../store/ui'
import { getPlaylists, getLikedSongs, ensureLiked } from '../services/playlist'

export function useLibrary() {
  const { setPlaylists, setLikedSongs } = useLibraryStore()

  useEffect(() => {
    async function load() {
      await ensureLiked()
      const [pls, liked] = await Promise.all([getPlaylists(), getLikedSongs()])
      setPlaylists(pls.filter(p => p.id !== 'liked-songs'))
      setLikedSongs(liked)
    }
    load()
  }, [setPlaylists, setLikedSongs])

  const refresh = async () => {
    await ensureLiked()
    const [pls, liked] = await Promise.all([getPlaylists(), getLikedSongs()])
    setPlaylists(pls.filter(p => p.id !== 'liked-songs'))
    setLikedSongs(liked)
  }

  return { refresh }
}
