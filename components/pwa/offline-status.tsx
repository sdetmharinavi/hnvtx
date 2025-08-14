'use client'
 
import { useState, useEffect } from 'react'
import { MdWifiOff, MdWifi } from 'react-icons/md'
 
export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
 
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Show "Back online" message briefly
        setTimeout(() => setWasOffline(false), 3000)
      }
    }
 
    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }
 
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
 
    // Check initial status
    setIsOnline(navigator.onLine)
 
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])
 
  // Show offline message
  if (!isOnline) {
    return (
      <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <MdWifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">You&apos;re offline</span>
        </div>
      </div>
    )
  }
 
  // Show "back online" message briefly
  if (isOnline && wasOffline) {
    return (
      <div className="fixed top-4 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <MdWifi className="h-5 w-5" />
          <span className="text-sm font-medium">Back online</span>
        </div>
      </div>
    )
  }
 
  return null
}