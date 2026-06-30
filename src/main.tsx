import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSearch } from './services/search'
import { ensureLiked } from './services/playlist'

// Initialize services
initSearch().catch(console.error)
ensureLiked().catch(console.error)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)