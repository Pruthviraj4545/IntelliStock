import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { useEffect, useRef } from 'react'

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md', actions = [] }) {
  // Trap focus and close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] ${SIZES[size]} z-50`}
          >
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="btn-icon w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {children}
              </div>

              {/* Footer Actions */}
              {actions.length > 0 && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className={action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({ isOpen, onClose, title, message, onConfirm, isDangerous = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      actions={[
        { label: 'Cancel',  onClick: onClose, variant: 'secondary' },
        { label: 'Confirm', onClick: () => { onConfirm(); onClose() }, variant: isDangerous ? 'danger' : 'primary' },
      ]}
    >
      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{message}</p>
    </Modal>
  )
}

export default Modal
