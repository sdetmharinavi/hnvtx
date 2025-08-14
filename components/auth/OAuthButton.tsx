// components/auth/OAuthButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FaGoogle } from 'react-icons/fa';
import { ButtonSpinner } from '../common/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';

interface OAuthButtonProps {
  provider: string;
  variant?: 'login' | 'signup';
  redirectTo?: string;
  className?: string;
  disabled?: boolean;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: FaGoogle,
    bgColor: 'bg-red-500 hover:bg-red-600',
    textColor: 'text-white',
  }
};

export default function OAuthButton({
  variant = 'login',
  className = '',
  disabled = false,
}: OAuthButtonProps) {
  const { signInWithGoogle, authState } = useAuth();
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // Prevent multiple clicks during loading
    if (isLocalLoading || authState === 'loading' ) return;
    
    try {
      setIsLocalLoading(true);
      // Set flag to indicate OAuth is in progress
      sessionStorage.setItem('oauth_in_progress', 'true');
      await signInWithGoogle();
    } catch (error) {
      console.error('OAuth error:', error);
    } finally {
      // Reset loading state after a delay to ensure UI feedback
      setTimeout(() => {
        setIsLocalLoading(false);
      }, 1000);
    }
  };

  const isLoading = isLocalLoading || authState === 'loading';
  const isButtonDisabled = disabled || isLoading;
  const config = providerConfig.google;

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isButtonDisabled}
      className={`
        flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg
        font-medium transition-all duration-200
        ${config.bgColor} ${config.textColor}
        ${isButtonDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-lg transform hover:-translate-y-0.5'
        }
        ${className}
      `}
    >
      {isLoading || localStorage.getItem('oauth_in_progress') === 'true' ? (
        <ButtonSpinner />
      ) : (
        <config.icon className="h-5 w-5" />
      )}
      <span>
        {isLoading 
          ? 'Connecting...' 
          : `${variant === 'signup' ? 'Sign up' : 'Continue'} with ${config.name}`
        }
      </span>
    </button>
  );
}