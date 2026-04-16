import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

// A simple named stat card used by Sales page
export function StatsCard({ title, value, icon: Icon, color = 'indigo', change, subtitle }) {
  const colors = {
    indigo:  { bg: 'bg-primary-600',  soft: 'bg-primary-50 dark:bg-primary-950/50', text: 'text-primary-600 dark:text-primary-400', grad: 'from-primary-600 to-primary-500' },
    green:   { bg: 'bg-success-600',  soft: 'bg-success-50 dark:bg-success-950/50', text: 'text-success-600 dark:text-success-400', grad: 'from-success-600 to-success-500' },
    blue:    { bg: 'bg-accent-600',   soft: 'bg-accent-50 dark:bg-accent-950/50',   text: 'text-accent-600 dark:text-accent-400',  grad: 'from-accent-600 to-accent-500'  },
    amber:   { bg: 'bg-warning-500',  soft: 'bg-warning-50 dark:bg-warning-950/50', text: 'text-warning-600 dark:text-warning-400',grad: 'from-warning-500 to-warning-400'},
    red:     { bg: 'bg-danger-600',   soft: 'bg-danger-50 dark:bg-danger-950/50',   text: 'text-danger-600 dark:text-danger-400',  grad: 'from-danger-600 to-danger-500'  },
  }
  const c = colors[color] || colors.indigo

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="card p-5 group relative overflow-hidden"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${c.grad} opacity-[0.06] pointer-events-none`} />
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span className="ml-auto badge badge-success text-[10px]">
            <TrendingUp size={10} /> {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  )
}

export default StatsCard
