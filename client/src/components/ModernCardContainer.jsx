import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Modern Card Component with glassmorphism and modern styling
 * Supports different variants and states
 */
export const ModernCardContainer = memo(function ModernCardContainer({
  children,
  gradient = false,
  glassEffect = true,
  hover = true,
  className = '',
  onClick,
  animate = true
}) {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  const baseClass = `
    rounded-2xl border border-gray-100 dark:border-slate-700
    bg-white dark:bg-slate-800 shadow-sm
    transition-all duration-300
  `

  const hoverClass = hover ? 'hover:shadow-xl hover:border-gray-200 dark:hover:border-slate-600' : ''
  const glasClass = glassEffect ? 'backdrop-blur-xl bg-white/80 dark:bg-slate-800/80' : ''

  return (
    <motion.div
      variants={animate ? variants : {}}
      className={`${baseClass} ${hoverClass} ${glasClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
})

export default ModernCardContainer
