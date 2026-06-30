import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'

const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const Library = lazy(() => import('./pages/Library'))
const LikedSongs = lazy(() => import('./pages/LikedSongs'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage'))
const Wrapped = lazy(() => import('./pages/Wrapped'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<PageLoader />}><Search /></Suspense>} />
          <Route path="/library" element={<Suspense fallback={<PageLoader />}><Library /></Suspense>} />
          <Route path="/library/liked" element={<Suspense fallback={<PageLoader />}><LikedSongs /></Suspense>} />
          <Route path="/library/history" element={<Suspense fallback={<PageLoader />}><HistoryPage /></Suspense>} />
          <Route path="/playlist/:id" element={<Suspense fallback={<PageLoader />}><PlaylistPage /></Suspense>} />
          <Route path="/wrapped" element={<Suspense fallback={<PageLoader />}><Wrapped /></Suspense>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}