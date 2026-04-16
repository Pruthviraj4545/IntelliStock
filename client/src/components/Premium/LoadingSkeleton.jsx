import { motion } from 'framer-motion'

/**
 * Loading Skeleton Component
 * ───────────────────────────
 * Displays skeleton placeholders while content loads
 */
export function LoadingSkeleton({
  width = '100%',
  height = '20px',
  rounded = 'md',
  className = '',
}) {
  const roundedClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }

  return (
    <motion.div
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width, height }}
      className={`
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        dark:from-slate-700 dark:via-slate-600 dark:to-slate-700
        ${roundedClasses[rounded]}
        ${className}
      `}
    />
  )
}

/**
 * Card Skeleton Component
 * ───────────────────────
 * Skeleton loader for card components
 */
export function CardSkeleton({
  lines = 3,
  showHeader = false,
  showFooter = false,
  className = '',
}) {
  return (
    <div className={`space-y-4 p-6 ${className}`}>
      {showHeader && (
        <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
          <LoadingSkeleton height="30px" className="mb-2" />
          <LoadingSkeleton height="16px" width="60%" />
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            height="16px"
            width={i === lines - 1 ? '80%' : '100%'}
          />
        ))}
      </div>

      {showFooter && (
        <div className="pt-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          <LoadingSkeleton width="80px" height="40px" rounded="lg" />
          <LoadingSkeleton width="100px" height="40px" rounded="lg" />
        </div>
      )}
    </div>
  )
}

/**
 * Table Skeleton Component
 * ───────────────────────
 * Skeleton loader for table structures
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton
            key={`header-${i}`}
            width={`${100 / columns}%`}
            height="20px"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <LoadingSkeleton
              key={`cell-${rowIdx}-${colIdx}`}
              width={`${100 / columns}%`}
              height="20px"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * List Skeleton Component
 * ───────────────────────
 * Skeleton loader for list items
 */
export function ListSkeleton({
  items = 5,
  hasAvatar = false,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {hasAvatar && (
            <LoadingSkeleton
              width="40px"
              height="40px"
              rounded="full"
            />
          )}
          <div className="flex-1 space-y-2">
            <LoadingSkeleton height="16px" width="60%" />
            <LoadingSkeleton height="14px" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Stats Skeleton Component
 * ────────────────────────
 * Skeleton loader for stat/KPI cards
 */
export function StatsSkeletons({
  count = 4,
  className = '',
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <LoadingSkeleton width="80px" height="20px" />
              <LoadingSkeleton width="40px" height="40px" rounded="lg" />
            </div>
            <LoadingSkeleton width="60%" height="32px" />
            <LoadingSkeleton width="80px" height="16px" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Dashboard Skeleton Component
 * ────────────────────────────
 * Complete skeleton layout for dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <LoadingSkeleton width="40%" height="32px" />
        <LoadingSkeleton width="60%" height="16px" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800">
            <div className="space-y-4">
              <LoadingSkeleton width="40%" height="16px" />
              <LoadingSkeleton width="60%" height="32px" />
              <LoadingSkeleton width="80px" height="16px" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-800">
            <LoadingSkeleton height="300px" className="mb-4" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800">
        <LoadingSkeleton width="30%" height="20px" className="mb-6" />
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  )
}

export default LoadingSkeleton
