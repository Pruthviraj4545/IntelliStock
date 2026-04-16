import { motion } from 'framer-motion'
import { forwardRef } from 'react'

/**
 * Premium Card Component
 * ──────────────────────────────
 * Glassmorphism, gradient effects, depth shadows, and smooth animations
 */
export const PremiumCard = forwardRef(({
  children,
  variant = 'default',
  hover = true,
  gradient = false,
  glow = false,
  glowColor = 'primary',
  className = '',
  animate = true,
  onClick,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-white dark:bg-slate-800 border border-gray-100/50 dark:border-slate-700/50 shadow-card dark:shadow-none dark:ring-1 dark:ring-white/10',
    glass: 'bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-xl',
    gradient: 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-800 dark:to-slate-800 border border-primary-100 dark:border-slate-700 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/10',
    elevated: 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-lg hover:shadow-hover-lg',
    subtle: 'bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm',
  }

  const glowColors = {
    primary: 'shadow-glow-primary',
    accent: 'shadow-glow-accent',
    success: 'shadow-glow-success',
    warning: 'shadow-glow-warning',
    danger: 'shadow-glow-danger',
  }

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  const selectedVariant = gradient ? 'gradient' : variant

  return (
    <motion.div
      ref={ref}
      variants={animate ? animationVariants : {}}
      initial={animate ? 'hidden' : undefined}
      whileInView={animate ? 'visible' : undefined}
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-300 cursor-pointer
        ${variants[selectedVariant]}
        ${hover ? 'hover:shadow-hover-lg hover:border-gray-200 dark:hover:border-slate-600' : ''}
        ${glow ? glowColors[glowColor] : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
})

PremiumCard.displayName = 'PremiumCard'

/**
 * Premium Card Header
 */
export const PremiumCardHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`px-6 py-5 border-b border-gray-100 dark:border-slate-700 ${className}`}
    {...props}
  >
    {children}
  </div>
))

PremiumCardHeader.displayName = 'PremiumCardHeader'

/**
 * Premium Card Body
 */
export const PremiumCardBody = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
))

PremiumCardBody.displayName = 'PremiumCardBody'

/**
 * Premium Card Footer
 */
export const PremiumCardFooter = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl ${className}`}
    {...props}
  >
    {children}
  </div>
))

PremiumCardFooter.displayName = 'PremiumCardFooter'

export default PremiumCard
