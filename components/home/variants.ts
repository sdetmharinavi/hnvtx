import { TargetAndTransition, Variants } from "framer-motion";

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.3,
      ease: "easeOut"
    },
  },
};

export const titleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60, 
    scale: 0.8 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 1.2,
      type: "spring",
      stiffness: 100,
      damping: 12
    },
  },
};

export const subtitleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

export const highlightVariants: Variants = {
  hidden: { 
    opacity: 0,
    scaleX: 0,
    transformOrigin: "left"
  },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 1.2,
      delay: 1.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

export const ctaVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8, 
      delay: 0.5,
      type: "spring",
      stiffness: 120,
      damping: 10
    },
  },
};

export const floatingAnimation: TargetAndTransition = {
  y: [-8, 8, -8],
  rotate: [-1, 1, -1],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  },
};