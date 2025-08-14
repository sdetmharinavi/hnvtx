'use client'
 
import { useState, useEffect } from 'react'
import { MdClose, MdDownload } from 'react-icons/md'
import { Button } from '../common/ui/Button'
 
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}
 
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
 
  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
 
    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }
 
    window.addEventListener('beforeinstallprompt', handler)
 
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
    })
 
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])
 
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
 
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }
 
  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }
 
  if (isInstalled || !showInstallPrompt) return null
 
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MdDownload className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-sm">Install App</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Install this app for a better experience
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Install
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
          >
            <MdClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}