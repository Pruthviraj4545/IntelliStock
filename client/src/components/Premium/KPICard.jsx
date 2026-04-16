import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'

/**
 * KPI Card Component
 * ─────────────────
 * Premium KPI/Stats card with animated counter, trend indicator, and gradient icon
 */
export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  gradient = 'from-primary-500 to-primary-600',
  accentColor = 'primary',
  decimals = 0,
  prefix = '',
  suffix = '',
  format,
  onClick,
  className = '',
  showTrend = true,
}) {
  const isPositive = change >= 0
  const trendColor = isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Gradient Overlay Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 blur-xl transition-all duration-300`} />

      {/* Card Container */}
      <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-gray-100/50 dark:border-slate-700/50 shadow-card hover:shadow-card-lg transition-all duration-300 overflow-hidden p-6 h-full flex flex-col justify-between">
        {/* Decorative Gradient Corner */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradient} opacity-5 rounded-full pointer-events-none`} />

        {/* Header */}
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            {/* Icon Badge */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
            >
              <Icon className="w-6 h-6" />
            </motion.div>

            {/* Trend Badge */}
            {showTrend && change !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  isPositive
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
                    : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(change)}%</span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-gray-600 dark:text-slate-400 text-sm font-medium mb-3">
            {title}
          </h3>

          {/* Value */}
          <div className="mb-4">
            <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {format ? (
                format(value)
              ) : (
                <>
                  {prefix}
                  <AnimatedCounter value={value} decimals={decimals} duration={2.5} />
                  {suffix}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Change Label */}
        {showTrend && change !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}
          >
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{changeLabel}</span>
          </motion.div>
        )}

        {/* Bottom Gradient Line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      </div>
    </motion.div>
  )
}

/**
 * Comparison KPI Card
 * ──────────────────
 * Two-column KPI card for comparing metrics
 */
export function ComparisonKPICard({
  title,
  primary,
  secondary,
  gradient = 'from-primary-500 to-primary-600',
  icon: Icon,
  className = '',
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`group relative overflow-hidden rounded-2xl ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 blur-xl transition-all duration-300`} />

      <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-gray-100/50 dark:border-slate-700/50 shadow-card p-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-gray-600 dark:text-slate-400 text-sm font-medium">
            {title}
          </h3>
          <motion.div
            whileHover={{ scale: 1.1 }}
            className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white`}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Primary Value */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              {primary.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {primary.value}
            </p>
            {primary.change && (
              <p className={`text-xs font-semibold ${primary.change > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {primary.change > 0 ? '↑' : '↓'} {Math.abs(primary.change)}%
              </p>
            )}
          </div>

          {/* Secondary Value */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              {secondary.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {secondary.value}
            </p>
            {secondary.change && (
              <p className={`text-xs font-semibold ${secondary.change > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {secondary.change > 0 ? '↑' : '↓'} {Math.abs(secondary.change)}%
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Feature Card Component
 * ────────────────────
 * Showcase card for features with icon and description
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = 'primary',
  image,
  onClick,
  className = '',
  featured = false,
}) {
  const accentGradients = {
    primary: 'from-primary-500 to-primary-600',
    accent: 'from-accent-500 to-accent-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600',
    info: 'from-info-500 to-info-600',
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer group
        ${featured ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
        ${className}
      `}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGradients[accent]} opacity-0 group-hover:opacity-5 transition-all duration-300`} />

      {/* Card */}
      <div className="relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full flex flex-col">
        {/* Image */}
        {image && (
          <div className="mb-4 -mx-6 -mt-6 h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 overflow-hidden rounded-t-2xl">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.15, rotate: 5 }}
          className={`inline-flex w-fit p-3 rounded-xl bg-gradient-to-br ${accentGradients[accent]} text-white shadow-lg mb-4`}
        >
          <Icon className="w-6 h-6" />
        </motion.div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-slate-400 flex-1 mb-4">
          {description}
        </p>

        {/* CTA Link */}
        <motion.div
          whileHover={{ x: 4 }}
          className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 group"
        >
          <span>Learn more</span>
          <motion.span
            group-hover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            →
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * Metric Card Component
 * ───────────────────
 * Compact card for displaying single metrics
 */
export function MetricCard({
  label,
  value,
  unit,
  change,
  icon: Icon,
  color = 'primary',
  className = '',
}) {
  const colorClasses = {
    primary: { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300' },
    success: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300' },
    warning: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300' },
    danger: { bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-700 dark:text-danger-300' },
  }

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color].bg} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className={`text-xs font-semibold ${colorClasses[color].text}`}>
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
            {unit && <span className="text-sm text-gray-600 dark:text-slate-400">{unit}</span>}
          </div>
          {change !== undefined && (
            <p className={`text-xs font-semibold ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
        {Icon && (
          <Icon className={`w-8 h-8 ${colorClasses[color].text} opacity-50`} />
        )}
      </div>
    </div>
  )
}

export default KPICard
