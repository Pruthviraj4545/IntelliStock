import { motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Premium Badge Component
 * ──────────────────────────
 * Animated pill-shaped badges with multiple variants and glow effects
 */
export function PremiumBadge({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onRemove,
  glow = false,
  animated = false,
  className = '',
}) {
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const variants = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
    accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-800',
    danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-800',
    info: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 border border-info-200 dark:border-info-800',
    gray: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600',
  }

  const glowVariants = {
    primary: 'shadow-glow-primary',
    accent: 'shadow-glow-accent',
    success: 'shadow-glow-success',
    warning: 'shadow-glow-warning',
    danger: 'shadow-glow-danger',
    info: 'shadow-glow-success',
    gray: '',
  }

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      exit={animated ? { opacity: 0, scale: 0.8 } : {}}
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full
        transition-all duration-300
        ${sizes[size]}
        ${variants[variant]}
        ${glow ? glowVariants[variant] : ''}
        ${className}
      `}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
      {onRemove && (
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="ml-1 hover:opacity-70 transition-opacity p-0"
          type="button"
        >
          <X className={iconSizes[size]} />
        </motion.button>
      )}
    </motion.div>
  )
}

/**
 * Badge Group Component
 * ─────────────────────
 * Container for multiple badges with responsive layout
 */
export function BadgeGroup({
  badges = [],
  onRemove,
  className = '',
  size = 'md',
  variant = 'primary',
}) {
  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {badges.map((badge, idx) => (
        <PremiumBadge
          key={typeof badge === 'string' ? badge : badge.id}
          variant={badge.variant || variant}
          size={size}
          icon={badge.icon}
          onRemove={badge.onRemove ? () => badge.onRemove(idx) : onRemove ? () => onRemove(idx) : undefined}
          glow={badge.glow}
          animated
        >
          {typeof badge === 'string' ? badge : badge.label}
        </PremiumBadge>
      ))}
    </div>
  )
}

/**
 * Status Badge Component
 * ──────────────────────
 * Specialized badge for status indicators with pulsing animation
 */
export function StatusBadge({
  status,
  label,
  size = 'md',
  pulse = true,
}) {
  const statusConfig = {
    active: { variant: 'success', emoji: '🟢' },
    inactive: { variant: 'gray', emoji: '⚫' },
    pending: { variant: 'warning', emoji: '🟡' },
    error: { variant: 'danger', emoji: '🔴' },
    processing: { variant: 'info', emoji: '🔵' },
  }

  const config = statusConfig[status] || statusConfig.inactive

  return (
    <motion.div
      animate={pulse && status === 'processing' ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <PremiumBadge
        variant={config.variant}
        size={size}
      >
        <span className="mr-0.5">{config.emoji}</span>
        {label || status}
      </PremiumBadge>
    </motion.div>
  )
}

export default PremiumBadge
