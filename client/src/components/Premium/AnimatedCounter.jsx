import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

/**
 * Animated Counter Component
 * ───────────────────────────
 * Smoothly animates numbers for KPI cards and stats
 */
export function AnimatedCounter({
  value = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 2.5,
  ease = 'easeOut',
  className = '',
  format,
}) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => {
    const base = Math.floor(latest)
    const rest = (latest - base).toFixed(3).slice(1)
    return decimals === 0 ? base : base + Number(rest).toFixed(decimals)
  })

  const displayValue = useTransform(rounded, (v) => {
    if (format) return format(v)
    return `${prefix}${v}${suffix}`
  })

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  )
}

/**
 * Animated Number with Formatter
 * ───────────────────────────────
 * Formats large numbers (K, M, B) and animates them
 */
export function FormattedCounter({
  value = 0,
  decimals = 1,
  duration = 2.5,
  className = '',
}) {
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(decimals) + 'B'
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(decimals) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(decimals) + 'K'
    }
    return num.toFixed(0)
  }

  const motionValue = useMotionValue(0)
  const displayValue = useTransform(motionValue, (latest) => formatNumber(latest))

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  )
}

/**
 * Progress Counter Component
 * ──────────────────────────
 * Animated counter with progress bar
 */
export function ProgressCounter({
  current = 0,
  total = 100,
  decimals = 0,
  duration = 2.5,
  showPercent = true,
  showLabel = true,
  label = 'Progress',
  color = 'primary',
  size = 'md',
  className = '',
}) {
  const percentage = (current / total) * 100

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const colorClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600',
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
            {label}
          </span>
          {showPercent && (
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
              <AnimatedCounter
                value={percentage}
                suffix="%"
                decimals={0}
                duration={duration}
              />
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClasses[color]} shadow-lg transition-all duration-300`}
        />
      </div>

      {/* Counter Display */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
        <span>
          <AnimatedCounter
            value={current}
            decimals={decimals}
            duration={duration}
          />
        </span>
        <span>/</span>
        <span>{total.toFixed(decimals)}</span>
      </div>
    </div>
  )
}

/**
 * Stat Counter with Change Indicator
 * ───────────────────────────────────
 * Displays a number with percentage change and trend arrow
 */
export function StatCounter({
  value = 0,
  change = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 2.5,
  className = '',
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          duration={duration}
        />
      </div>

      {change !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-semibold flex items-center gap-1 ${
            change > 0
              ? 'text-success-600 dark:text-success-400'
              : 'text-danger-600 dark:text-danger-400'
          }`}
        >
          <span>{change > 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(change)}%</span>
          <span className="text-gray-600 dark:text-slate-400">vs last month</span>
        </motion.div>
      )}
    </div>
  )
}

export default AnimatedCounter
