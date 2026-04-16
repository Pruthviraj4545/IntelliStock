import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

const COLOR_MAP = {
  indigo:  { bg: 'bg-primary-600',  soft: 'bg-primary-50 dark:bg-primary-950/50',  text: 'text-primary-600 dark:text-primary-400', gradient: 'from-primary-600 to-primary-500' },
  blue:    { bg: 'bg-accent-600',   soft: 'bg-accent-50 dark:bg-accent-950/50',    text: 'text-accent-600 dark:text-accent-400',   gradient: 'from-accent-600 to-accent-500'   },
  green:   { bg: 'bg-success-600',  soft: 'bg-success-50 dark:bg-success-950/50',  text: 'text-success-600 dark:text-success-400', gradient: 'from-success-600 to-success-500' },
  emerald: { bg: 'bg-success-600',  soft: 'bg-success-50 dark:bg-success-950/50',  text: 'text-success-600 dark:text-success-400', gradient: 'from-success-600 to-success-500' },
  amber:   { bg: 'bg-warning-500',  soft: 'bg-warning-50 dark:bg-warning-950/50',  text: 'text-warning-600 dark:text-warning-400', gradient: 'from-warning-500 to-warning-400' },
  red:     { bg: 'bg-danger-600',   soft: 'bg-danger-50 dark:bg-danger-950/50',    text: 'text-danger-600 dark:text-danger-400',   gradient: 'from-danger-600 to-danger-500'   },
  rose:    { bg: 'bg-danger-600',   soft: 'bg-danger-50 dark:bg-danger-950/50',    text: 'text-danger-600 dark:text-danger-400',   gradient: 'from-danger-600 to-danger-500'   },
  purple:  { bg: 'bg-primary-600',  soft: 'bg-primary-50 dark:bg-primary-950/50',  text: 'text-primary-600 dark:text-primary-400', gradient: 'from-primary-600 to-primary-500' },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  subtitle,
  color = 'indigo',
  trend,
  description,
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.indigo
  const isPositive = changeType !== 'decrease'

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="card p-5 group relative overflow-hidden"
    >
      {/* Subtle corner accent */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.06] pointer-events-none`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {(change || trend) && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
            isPositive
              ? 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300'
              : 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
          }`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change || trend}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{title}</p>
      {(subtitle || description) && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle || description}</p>
      )}

      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  )
}

export default StatsCard