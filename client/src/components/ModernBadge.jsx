import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Modern Badge Component
 * Supports different variants, sizes, and colors
 */
export const ModernBadge = memo(function ModernBadge({
  children,
  variant = 'primary', // primary, success, warning, danger, info
  size = 'md', // sm, md, lg
  icon: Icon = null,
  dismissible = false,
  onDismiss,
  className = ''
}) {
  const variants = {
    primary: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
    success: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    danger: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-2 rounded-full font-medium transition-all ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {dismissible && (
        <motion.button
          onClick={onDismiss}
          className="ml-1 hover:opacity-70 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      )}
    </motion.div>
  )
})

export default ModernBadge
