import { motion } from 'framer-motion'
import { forwardRef } from 'react'

/**
 * Premium Button Component
 * ─────────────────────────────
 * Supports multiple variants with smooth animations, glow effects, and micro-interactions
 */
export const PremiumButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  isIconOnly = false,
  ...props
}, ref) => {
  // Size configurations
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3.5 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }

  // Variant styles
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-glow-primary dark:from-primary-500 dark:to-primary-600',
    secondary: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600',
    accent: 'bg-gradient-to-r from-accent-600 to-accent-500 text-white hover:shadow-glow-accent dark:from-accent-500 dark:to-accent-600',
    success: 'bg-gradient-to-r from-success-600 to-success-500 text-white hover:shadow-glow-success dark:from-success-500 dark:to-success-600',
    danger: 'bg-gradient-to-r from-danger-600 to-danger-500 text-white hover:shadow-glow-danger dark:from-danger-500 dark:to-danger-600',
    warning: 'bg-gradient-to-r from-warning-600 to-warning-500 text-white hover:shadow-glow-warning dark:from-warning-500 dark:to-warning-600',
    outline: 'border-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-900/50',
    ghost: 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/50',
  }

  const baseClass = `
    inline-flex items-center justify-center font-semibold rounded-lg
    transition-all duration-300 active:animate-press
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
    dark:focus:ring-offset-slate-900 dark:focus:ring-primary-400
  `

  const hoverClass = !disabled ? 'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0' : ''

  const buttonContent = (
    <>
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={iconSizes[size]} />
      )}
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={iconSizes[size]}
        >
          <Icon className={iconSizes[size]} />
        </motion.div>
      )}
      {!isIconOnly && <span>{children}</span>}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className={iconSizes[size]} />
      )}
    </>
  )

  return (
    <motion.button
      ref={ref}
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        ${baseClass}
        ${isIconOnly ? 'w-10 h-10 p-0' : sizes[size]}
        ${variants[variant]}
        ${hoverClass}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {buttonContent}
    </motion.button>
  )
})

PremiumButton.displayName = 'PremiumButton'

export default PremiumButton
