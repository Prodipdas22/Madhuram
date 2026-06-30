import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Menu, Bell } from 'lucide-react'
import { useUIStore } from '../../store/ui'

export function TopBar() {
  const navigate = useNavigate()
  const { toggleSidebar } = useUIStore()

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white transition-colors mr-2">
          <Menu size={20} />
        </button>
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => navigate(1)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>
      <button className="text-gray-400 hover:text-white transition-colors">
        <Bell size={20} />
      </button>
    </div>
  )
}