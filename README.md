# Madhuram 🎵

A zero-cost Spotify-inspired music streaming platform that runs entirely on GitHub Pages.

## Features

- 🎵 Stream music from YouTube, Internet Archive, and Free Music Archive
- 🔍 Fuzzy search with autocomplete and search history
- 📋 Playlists with drag-and-drop reordering, export/import JSON
- ❤️ Liked Songs, listening history
- 🤖 Recommendation engine based on play counts, likes, and habits
- 🎯 Daily Mixes & Discover Weekly generated in-browser
- 📊 Your Wrapped — yearly listening stats
- ⌨️ Keyboard shortcuts (Space, Arrow keys)
- 📱 PWA — installable, offline shell
- 🎨 Spotify-inspired dark glassmorphic UI

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand · Dexie.js (IndexedDB) · Fuse.js · @dnd-kit · Vite PWA

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy on every push to `main`
3. Enable GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch

Or deploy manually:
```bash
npm run deploy
```

## Architecture

All data is stored locally:
- **IndexedDB** (via Dexie.js) — songs metadata, playlists, stats, history
- **LocalStorage** — player preferences (volume, shuffle, repeat)

Music is never stored — only metadata (video IDs, titles, thumbnails). Audio streams come from:
- **YouTube** via embedded IFrame Player API (no API key required with Invidious fallback)
- **Internet Archive** — public domain audio files
- **Free Music Archive** — Creative Commons licensed tracks

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Shift + →` | Next track |
| `Shift + ←` | Previous track |
| `→` | Seek +10s |
| `←` | Seek -10s |
| `↑` | Volume up |
| `↓` | Volume down |

## Folder Structure

```
src/
├── components/
│   ├── layout/     # Layout, Sidebar, TopBar
│   ├── player/     # AudioEngine, PlayerBar, FullscreenPlayer, Equalizer
│   └── ui/         # SongCard, SectionRow, Notification, AddToPlaylistModal
├── hooks/          # useDebounce, useKeyboardShortcuts, useLibrary
├── pages/          # Home, Search, Library, PlaylistPage, Wrapped, etc.
├── services/       # youtube, archive, fma, db, search, recommendations, playlist, wrapped
├── store/          # player (Zustand), ui (Zustand)
├── types/          # TypeScript interfaces
└── utils/          # formatDuration, cn, generateGradient, etc.
```