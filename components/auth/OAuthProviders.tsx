// components/auth/OAuthProviders.tsx
'use client';

import { OAuthButton } from '@/components/auth/OAuthButton';

interface OAuthProvidersProps {
  variant?: 'login' | 'signup';
  redirectTo?: string;
  providers?: string[];
  className?: string;
  showDivider?: boolean;
  dividerText?: string;
}

const defaultProviders: string[] = ['google'];

export default function OAuthProviders({
  variant = 'login',
  providers = defaultProviders,
  className = '',
  showDivider = true,
  dividerText,
}: OAuthProvidersProps) {
  const defaultDividerText = variant === 'signup' 
    ? 'Or sign up with email' 
    : 'Or continue with email';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        {providers.map((provider) => (
          <OAuthButton
            key={provider}
            provider={provider}
            variant={variant}
          />
        ))}
      </div>

      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {dividerText || defaultDividerText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}