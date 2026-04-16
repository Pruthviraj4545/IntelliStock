import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

// Color config aligned to the mandatory palette
const COLOR_CONFIG = {
  indigo: {
    gradient: 'from-primary-600 to-primary-500',
    iconBg:   'bg-primary-600',
    glow:     'shadow-primary',
    badge:    'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    ring:     'ring-primary-200 dark:ring-primary-800',
    accent:   'from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/20',
    bar:      'bg-primary-600',
  },
  blue: {
    gradient: 'from-accent-600 to-accent-500',
    iconBg:   'bg-accent-600',
    glow:     'shadow-md',
    badge:    'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300',
    ring:     'ring-accent-200 dark:ring-accent-800',
    accent:   'from-accent-50 to-accent-100 dark:from-accent-950/30 dark:to-accent-900/20',
    bar:      'bg-accent-500',
  },
  emerald: {
    gradient: 'from-success-600 to-success-500',
    iconBg:   'bg-success-600',
    glow:     'shadow-success',
    badge:    'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300',
    ring:     'ring-success-200 dark:ring-success-800',
    accent:   'from-success-50 to-green-100 dark:from-success-950/30 dark:to-success-900/20',
    bar:      'bg-success-500',
  },
  amber: {
    gradient: 'from-warning-500 to-warning-400',
    iconBg:   'bg-warning-500',
    glow:     'shadow-warning',
    badge:    'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
    ring:     'ring-warning-200 dark:ring-warning-800',
    accent:   'from-warning-50 to-yellow-100 dark:from-warning-950/30 dark:to-warning-900/20',
    bar:      'bg-warning-500',
  },
  rose: {
    gradient: 'from-danger-600 to-danger-500',
    iconBg:   'bg-danger-600',
    glow:     'shadow-danger',
    badge:    'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400',
    ring:     'ring-danger-200 dark:ring-danger-800',
    accent:   'from-danger-50 to-red-100 dark:from-danger-950/30 dark:to-danger-900/20',
    bar:      'bg-danger-500',
  },
}

export function PremiumStatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  subtitle,
  color = 'indigo',
}) {
  const c = COLOR_CONFIG[color] || COLOR_CONFIG.indigo
  const isPositive = changeType !== 'decrease'

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="card p-6 relative overflow-hidden group"
    >
      {/* Decorative background orb */}
      <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-300`} />

      {/* Top row: icon + change badge */}
      <div className="flex items-start justify-between mb-5">
        <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ${c.glow}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {change !== undefined && change !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ${
              isPositive
                ? 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300 ring-success-200 dark:ring-success-800'
                : 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 ring-danger-200 dark:ring-danger-800'
            }`}
          >
            {isPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {typeof change === 'string' ? change : `${change}%`}
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight leading-none">
          {value}
        </p>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>
      )}

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ArrowUpRight size={16} className="text-gray-300 dark:text-slate-600" />
      </div>
    </motion.div>
  )
}

export default PremiumStatsCard
