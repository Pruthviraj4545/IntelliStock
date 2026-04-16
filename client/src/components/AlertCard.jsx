import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, Package } from 'lucide-react'

function AlertCard({ type, title, message, actionText, onAction }) {
  const getAlertConfig = () => {
    switch (type) {
      case 'low-stock':
        return {
          icon: Package,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        }
      case 'out-of-stock':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        }
      case 'reorder':
        return {
          icon: TrendingDown,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800'
        }
      default:
        return {
          icon: AlertTriangle,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800'
        }
    }
  }

  const config = getAlertConfig()
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} flex items-start space-x-3`}
    >
      <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`font-medium ${config.textColor}`}>{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{message}</p>

        {actionText && onAction && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 underline"
          >
            {actionText}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default AlertCard