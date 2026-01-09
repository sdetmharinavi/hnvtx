// app/not-found.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/common/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-screen w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-8 relative inline-block"
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-full shadow-xl border border-gray-100 dark:border-gray-700">
            <FileQuestion className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 dark:text-gray-400 mb-8 text-lg"
        >
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto" leftIcon={<Home size={18} />}>
              Go to Dashboard
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft size={18} />}
          >
            Go Back
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
