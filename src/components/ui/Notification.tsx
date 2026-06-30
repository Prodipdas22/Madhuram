import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useUIStore } from '../../store/ui'

export function Notification() {
  const { notification } = useUIStore()

  const icons = {
    success: <CheckCircle size={16} className="text-accent" />,
    error: <XCircle size={16} className="text-red-400" />,
    info: <Info size={16} className="text-blue-400" />
  }

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.message}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-800 border border-white/10 shadow-2xl text-sm text-white"
        >
          {icons[notification.type]}
          {notification.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
