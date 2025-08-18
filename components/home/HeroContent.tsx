import {
  motion,
  MotionValue,
  TargetAndTransition,
  Variants,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingSpinner } from "../common/ui/LoadingSpinner";

interface HeroContentProps {
  variants: {
    containerVariants: Variants;
    titleVariants: Variants;
    subtitleVariants: Variants;
    highlightVariants: Variants;
    ctaVariants: Variants;
  };
  floatingAnimation: TargetAndTransition;
  textY: MotionValue<number>;
}

export default function HeroContent({
  variants,
  floatingAnimation,
  textY,
}: HeroContentProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGetStarted = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    router.push("/dashboard");
    // setTimeout(() => {
    //   router.push("/dashboard");
    // }, 1000); // Simulate loading for 1 second
  };
  return (
    <motion.div
      className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6 overflow-hidden"
      style={{ y: textY }}
      variants={variants.containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating badge */}
      <motion.div
        variants={variants.ctaVariants}
        animate={floatingAnimation}
        className="mb-6 rounded-full border border-red-400/40 bg-gradient-to-r from-red-500/20 to-purple-500/20 px-4 py-2 text-red-200 shadow-lg backdrop-blur-md sm:mb-8 sm:px-6 sm:py-3 dark:border-blue-400/40 dark:from-blue-500/20 dark:to-cyan-500/20 dark:text-blue-200"
      >
        <span className="text-xs font-semibold tracking-wide sm:text-sm">
          🚀 Advanced Database Management
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={variants.titleVariants}
        className="relative mb-4 text-3xl leading-tight font-black text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl dark:text-gray-100"
      >
        <span className="mb-1 block text-2xl sm:mb-2 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
          Welcome to
        </span>
        <span className="block bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl dark:from-blue-400 dark:via-purple-500 dark:to-cyan-400">
          Harinavi Transmission
        </span>
        <span className="mt-1 block text-2xl font-semibold text-gray-200 sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl dark:text-gray-300">
          Record Database
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={variants.subtitleVariants}
        className="mb-6 max-w-xs px-2 text-base leading-relaxed text-gray-300 sm:mb-8 sm:max-w-2xl sm:px-0 sm:text-lg md:text-xl lg:max-w-3xl lg:text-2xl dark:text-gray-400"
      >
        Secure, reliable, and efficient database management for transmission
        records
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        variants={variants.ctaVariants}
        className="mt-2 flex w-full max-w-xs flex-col gap-3 px-4 sm:mt-4 sm:max-w-md sm:flex-row sm:gap-4 sm:px-0"
      >
        <motion.button
          whileHover={{
            scale: 1.02,
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)",
          }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 text-base font-bold text-white shadow-xl transition-all hover:from-red-600 hover:to-red-700 sm:px-8 sm:py-4 sm:text-lg dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800"
          disabled={loading}
          onClick={handleGetStarted}
        >
          {loading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Get Started"
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
