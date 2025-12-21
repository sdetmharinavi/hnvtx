// path: components/home/FooterLinks.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const footerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 1.2,
      ease: "easeInOut",
    },
  },
};

export default function FooterLinks() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants={footerVariants as any}
      initial="hidden"
      animate="visible"
      className="absolute bottom-0 left-0 right-0 z-10 p-4 text-center"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500">
        <span>&copy; {currentYear} Harinavi. All Rights Reserved.</span>
        <div className="flex items-center gap-x-4">
          <Link
            href="/terms"
            className="transition-colors hover:text-white dark:hover:text-gray-300"
          >
            Terms of Service
          </Link>
          <span className="opacity-50">|</span>
          <Link
            href="/privacy"
            className="transition-colors hover:text-white dark:hover:text-gray-300"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </motion.footer>
  );
}