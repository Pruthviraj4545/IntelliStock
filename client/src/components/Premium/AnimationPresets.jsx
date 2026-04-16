/**
 * Framer Motion Animation Presets & Utilities
 * ─────────────────────────────────────────────
 * Reusable animation configurations for consistent and smooth interactions
 */

// ═════════════════════════════════════════════════════════════════════════════
// PAGE & SECTION ANIMATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.7, 0, 0.84, 0],
    },
  },
}

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
}

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
}

export const slideDownVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
}

export const slideLeftVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.2,
    },
  },
}

export const slideRightVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.2,
    },
  },
}

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGGER ANIMATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD & COMPONENT ANIMATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const cardHoverVariants = {
  rest: { y: 0, boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08)' },
  hover: {
    y: -4,
    boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.15)',
    transition: {
      duration: 0.3,
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}

export const buttonHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

// ═════════════════════════════════════════════════════════════════════════════
// MICRO-INTERACTIONS
// ═════════════════════════════════════════════════════════════════════════════

export const tapScaleVariants = {
  rest: { scale: 1 },
  tap: { scale: 0.95 },
}

export const popVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
}

export const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const shakeVariants = {
  shake: {
    x: [-2, 2, -2, 2, 0],
    transition: {
      duration: 0.3,
    },
  },
}

export const floatVariants = {
  float: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// TOOLTIP & POPOVER ANIMATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const tooltipVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 8,
    transition: {
      duration: 0.15,
    },
  },
}

export const popoverVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: {
      duration: 0.15,
    },
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// DROPDOWN & MENU ANIMATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const dropdownVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
}

export const menuItemVariants = {
  rest: { paddingLeft: '1rem' },
  hover: {
    paddingLeft: '1.25rem',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// SPRING TRANSITIONS
// ═════════════════════════════════════════════════════════════════════════════

export const springConfig = {
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 20,
  },
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 40,
  },
  bouncy: {
    type: 'spring',
    stiffness: 500,
    damping: 15,
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// EASING FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

export const easing = {
  premium: [0.16, 1, 0.3, 1],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInExpo: [0.7, 0, 0.84, 0],
  easeInOutExpo: [0.87, 0, 0.13, 1],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInBack: [0.6, -0.28, 0.735, 0.045],
}

// ═════════════════════════════════════════════════════════════════════════════
// TRANSITION CONFIGURATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const transitions = {
  fast: { duration: 0.15, ease: easing.premium },
  normal: { duration: 0.3, ease: easing.premium },
  slow: { duration: 0.5, ease: easing.premium },
  verySlow: { duration: 0.8, ease: easing.premium },
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER HOOKS FOR ANIMATIONS
// ═════════════════════════════════════════════════════════════════════════════

export const useStaggerAnimation = (delay = 0.1) => ({
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easing.premium,
      },
    },
  },
})

// ═════════════════════════════════════════════════════════════════════════════
// COMMON ANIMATION PATTERNS
// ═════════════════════════════════════════════════════════════════════════════

export const animationPatterns = {
  // Card entrance
  cardEntrance: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: easing.premium },
  },

  // Button click feedback
  buttonClick: {
    tap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 40 },
  },

  // Icon rotation
  iconRotate: {
    animate: { rotate: 360 },
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },

  // Fade in and out
  fadeInOut: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  // List stagger
  listStagger: {
    container: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3 },
    },
  },
}

export default {
  pageVariants,
  fadeInVariants,
  slideUpVariants,
  slideDownVariants,
  slideLeftVariants,
  slideRightVariants,
  scaleInVariants,
  containerVariants,
  itemVariants,
  gridContainerVariants,
  gridItemVariants,
  cardHoverVariants,
  buttonHoverVariants,
  modalVariants,
  backdropVariants,
  tapScaleVariants,
  popVariants,
  pulseVariants,
  shakeVariants,
  floatVariants,
  tooltipVariants,
  popoverVariants,
  dropdownVariants,
  menuItemVariants,
  springConfig,
  easing,
  transitions,
  useStaggerAnimation,
  animationPatterns,
}
