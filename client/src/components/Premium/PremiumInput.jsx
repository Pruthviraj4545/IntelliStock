import { motion } from 'framer-motion'
import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

/**
 * Premium Input Component
 * ────────────────────────────
 * Enhanced input with focus ring animation, validation states, and smooth interactions
 */
export const PremiumInput = forwardRef(({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  hint,
  icon: Icon,
  endIcon: EndIcon,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    setIsTouched(true)
    onBlur?.(e)
  }

  const showValidation = isTouched && (error || success)

  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-danger-500">*</span>}
        </label>
      )}

      <div className="relative group">
        {/* Focus glow effect */}
        <motion.div
          animate={{
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1 : 0.95,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 pointer-events-none"
        />

        <div className="relative flex items-center">
          {/* Start Icon */}
          {Icon && (
            <div className="absolute left-4 text-gray-400 dark:text-slate-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-300 pointer-events-none">
              <Icon className="w-5 h-5" />
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={`
              w-full px-4 py-2.5 rounded-lg font-medium
              bg-white dark:bg-slate-800 
              border-2 transition-all duration-300
              text-gray-900 dark:text-white 
              placeholder-gray-400 dark:placeholder-slate-500
              focus:outline-none focus:ring-0
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-900
              ${Icon ? 'pl-10' : ''}
              ${type === 'password' ? 'pr-10' : ''}
              ${!error && !success ? 'border-gray-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-400' : ''}
              ${error ? 'border-danger-300 dark:border-danger-600 focus:border-danger-500 dark:focus:border-danger-400' : ''}
              ${success && !error ? 'border-success-300 dark:border-success-600 focus:border-success-500 dark:focus:border-success-400' : ''}
              ${className}
            `}
            {...props}
          />

          {/* End Icon / Password Toggle / Validation Icon */}
          <div className="absolute right-4 flex items-center gap-2 pointer-events-auto">
            {type === 'password' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </motion.button>
            )}

            {showValidation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {error ? (
                  <AlertCircle className="w-5 h-5 text-danger-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-success-500" />
                )}
              </motion.div>
            )}

            {EndIcon && !showValidation && (
              <EndIcon className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            )}
          </div>
        </div>
      </div>

      {/* Error / Success / Hint Message */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: showValidation || hint ? 1 : 0, y: showValidation || hint ? 0 : -5 }}
        transition={{ duration: 0.2 }}
        className="mt-2 text-sm font-medium"
      >
        {error && (
          <p className="text-danger-600 dark:text-danger-400 flex items-center gap-1">
            {error}
          </p>
        )}
        {success && !error && (
          <p className="text-success-600 dark:text-success-400 flex items-center gap-1">
            {success}
          </p>
        )}
        {hint && !showValidation && (
          <p className="text-gray-500 dark:text-slate-400">
            {hint}
          </p>
        )}
      </motion.div>
    </div>
  )
})

PremiumInput.displayName = 'PremiumInput'

/**
 * Premium Textarea Component
 */
export const PremiumTextarea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  hint,
  rows = 4,
  maxLength,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    setIsTouched(true)
    onBlur?.(e)
  }

  const showValidation = isTouched && (error || success)
  const charCount = value?.length || 0

  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-danger-500">*</span>}
        </label>
      )}

      <div className="relative group">
        {/* Focus glow effect */}
        <motion.div
          animate={{
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1 : 0.95,
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 pointer-events-none"
        />

        <textarea
          ref={ref}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 rounded-lg font-medium resize-none
            bg-white dark:bg-slate-800 
            border-2 transition-all duration-300
            text-gray-900 dark:text-white 
            placeholder-gray-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-0
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-900
            ${!error && !success ? 'border-gray-200 dark:border-slate-700 focus:border-primary-500 dark:focus:border-primary-400' : ''}
            ${error ? 'border-danger-300 dark:border-danger-600 focus:border-danger-500 dark:focus:border-danger-400' : ''}
            ${success && !error ? 'border-success-300 dark:border-success-600 focus:border-success-500 dark:focus:border-success-400' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {/* Character count + error/success message */}
      <div className="mt-2 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: showValidation || hint ? 1 : 0, y: showValidation || hint ? 0 : -5 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium"
        >
          {error && (
            <p className="text-danger-600 dark:text-danger-400">
              {error}
            </p>
          )}
          {success && !error && (
            <p className="text-success-600 dark:text-success-400">
              {success}
            </p>
          )}
          {hint && !showValidation && (
            <p className="text-gray-500 dark:text-slate-400">
              {hint}
            </p>
          )}
        </motion.div>

        {maxLength && (
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
})

PremiumTextarea.displayName = 'PremiumTextarea'

export default PremiumInput
