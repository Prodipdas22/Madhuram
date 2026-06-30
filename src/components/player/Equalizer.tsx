import { motion } from 'framer-motion'

interface EqualizerProps { isPlaying: boolean; className?: string }

const BARS = [0.4, 0.7, 1.0, 0.6, 0.85, 0.5, 0.9]

export function Equalizer({ isPlaying, className = '' }: EqualizerProps) {
  return (
    <div className={`flex items-end gap-px h-4 ${className}`}>
      {BARS.map((h, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-accent rounded-t"
          animate={isPlaying ? { scaleY: [h * 0.3, h, h * 0.5, h * 0.8, h * 0.3] } : { scaleY: 0.2 }}
          transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 }}
          style={{ originY: 1, height: 16 }}
        />
      ))}
    </div>
  )
}
