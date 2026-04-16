import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

// ─── Global Toast State ─────────────────────────────────────────────
let globalToasts = []
let toastId = 0
let listeners = []

const addListener    = (fn) => { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn) } }
const notifyAll      = ()   => listeners.forEach(fn => fn([...globalToasts]))
const removeToast    = (id) => { globalToasts = globalToasts.filter(t => t.id !== id); notifyAll() }

const addToast = ({ message, type = 'info', duration = 3000 }) => {
  const id = ++toastId
  globalToasts = [...globalToasts, { id, message, type, duration }]
  notifyAll()
  if (duration !== 'infinite') {
    setTimeout(() => removeToast(id), duration)
  }
  return id
}

// ─── Hook ────────────────────────────────────────────────────────────
export function useToast() {
  return {
    show:    (msg, type, dur)  => addToast({ message: msg, type, duration: dur }),
    success: (msg, dur = 3000) => addToast({ message: msg, type: 'success', duration: dur }),
    error:   (msg, dur = 5000) => addToast({ message: msg, type: 'error',   duration: dur }),
    info:    (msg, dur = 3000) => addToast({ message: msg, type: 'info',    duration: dur }),
    warning: (msg, dur = 4000) => addToast({ message: msg, type: 'warning', duration: dur }),
  }
}

// ─── Config ──────────────────────────────────────────────────────────
const ICONS = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info }

const STYLES = {
  success: {
    wrap:  'bg-white dark:bg-slate-800 border border-success-200 dark:border-success-800',
    icon:  'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30',
    title: 'text-success-800 dark:text-success-300',
    msg:   'text-success-700 dark:text-success-400',
    bar:   'bg-success-500',
  },
  error: {
    wrap:  'bg-white dark:bg-slate-800 border border-danger-200 dark:border-danger-800',
    icon:  'text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30',
    title: 'text-danger-800 dark:text-danger-300',
    msg:   'text-danger-700 dark:text-danger-400',
    bar:   'bg-danger-500',
  },
  warning: {
    wrap:  'bg-white dark:bg-slate-800 border border-warning-200 dark:border-warning-800',
    icon:  'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/30',
    title: 'text-warning-800 dark:text-warning-400',
    msg:   'text-warning-700 dark:text-warning-500',
    bar:   'bg-warning-500',
  },
  info: {
    wrap:  'bg-white dark:bg-slate-800 border border-accent-200 dark:border-accent-800',
    icon:  'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30',
    title: 'text-accent-800 dark:text-accent-300',
    msg:   'text-accent-700 dark:text-accent-400',
    bar:   'bg-accent-500',
  },
}

const LABELS = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' }

// ─── Single Toast Item ────────────────────────────────────────────────
function ToastItem({ toast }) {
  const [progress, setProgress] = useState(100)
  const s = STYLES[toast.type] || STYLES.info
  const Icon = ICONS[toast.type] || Info

  useEffect(() => {
    if (toast.duration === 'infinite') return
    const start = Date.now()
    const total = toast.duration || 3000
    const raf = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.max(0, 100 - (elapsed / total) * 100))
    }, 30)
    return () => clearInterval(raf)
  }, [toast.duration])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative flex items-start gap-3 p-4 rounded-2xl shadow-xl min-w-[280px] max-w-sm overflow-hidden ${s.wrap}`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
        <Icon size={17} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-bold leading-none mb-1 ${s.title}`}>
          {LABELS[toast.type]}
        </p>
        <p className={`text-xs leading-relaxed ${s.msg}`}>
          {toast.message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <X size={14} />
      </button>

      {/* Progress Bar */}
      {toast.duration !== 'infinite' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-slate-700">
          <div
            className={`h-full ${s.bar} transition-none rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ─── Container ───────────────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([...globalToasts])
  useEffect(() => addListener(setToasts), [])

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Inline Alert ────────────────────────────────────────────────────
export function Alert({ type = 'info', title, message, onClose, action }) {
  const s = STYLES[type] || STYLES.info
  const Icon = ICONS[type] || Info

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`alert flex items-start justify-between gap-3 ${s.wrap}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.icon}`}>
          <Icon size={15} />
        </div>
        <div>
          {title   && <p className={`text-sm font-semibold ${s.title}`}>{title}</p>}
          {message && <p className={`text-xs mt-0.5 leading-relaxed ${s.msg}`}>{message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          <button onClick={action.onClick} className={`text-xs font-semibold underline ${s.title} hover:no-underline`}>
            {action.label}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
