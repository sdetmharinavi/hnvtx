// components/pwa/offline-status.tsx
'use client'
 
import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { motion, AnimatePresence } from 'framer-motion'
 
export default function OfflineStatus() {
  const isOnline = useOnlineStatus()
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
 
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline) {
      // If we were offline and now we are online
      setShowOnlineToast(true)
      const timer = setTimeout(() => {
        setShowOnlineToast(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])
 
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-6 left-1/2 z-9999 flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-full shadow-lg border border-red-500"
        >
          <WifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">You are currently offline</span>
        </motion.div>
      )}

      {showOnlineToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-6 left-1/2 z-9999 flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg border border-green-500"
        >
          <Wifi className="h-5 w-5" />
          <span className="text-sm font-medium">Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}