// components/auth/OAuthButton.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FaGoogle } from "react-icons/fa";
import { LoadingSpinner } from "../common/ui/LoadingSpinner/LoadingSpinner";

// Debug helper
const debug = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[OAuthButton]", ...args);
  }
};

interface OAuthButtonProps {
  provider: string;
  variant?: "login" | "signup";
  className?: string;
  disabled?: boolean;
}

const providerConfig = {
  google: {
    name: "Google",
    icon: FaGoogle,
    bgColor: "bg-white hover:bg-gray-50",
    textColor: "text-gray-800",
  },
} as const;

export function OAuthButton({
  provider,
  variant = "login",
  className = "",
  disabled = false,
}: OAuthButtonProps) {
  const { signInWithGoogle, authState } = useAuth();
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);

  // Handle OAuth sign-in
  const handleGoogleSignIn = useCallback(async () => {
    debug("handleGoogleSignIn called");

    // Prevent multiple clicks during loading
    if (isLocalLoading || authState === "loading") {
      debug("Already loading, ignoring click");
      return;
    }

    try {
      debug("Setting loading state");
      setIsLocalLoading(true);
      setIsOAuthInProgress(true);
      sessionStorage.setItem("oauth_in_progress", "true");

      // Force a re-render to show loading state
      await new Promise((resolve) => setTimeout(resolve, 0));

      debug("Calling signInWithGoogle");
      await signInWithGoogle();
      debug("signInWithGoogle completed");
    } catch (error) {
      debug("OAuth error:", error);
      sessionStorage.removeItem("oauth_in_progress");
      setIsOAuthInProgress(false);
      throw error;
    } finally {
      debug("Cleaning up");
      setIsLocalLoading(false);
      sessionStorage.removeItem("oauth_in_progress");
    }
  }, [isLocalLoading, authState, signInWithGoogle]);

  // Check for OAuth in progress on mount
  useEffect(() => {
    const checkOAuthStatus = () => {
      const inProgress = sessionStorage.getItem("oauth_in_progress") === "true";
      setIsOAuthInProgress(inProgress);
    };

    // Check immediately
    checkOAuthStatus();

    // Set up storage event listener for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "oauth_in_progress") {
        checkOAuthStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Combine all loading states
  const isLoading =
    isLocalLoading || authState === "loading" || isOAuthInProgress;
  const isButtonDisabled = disabled || isLoading;
  const config = providerConfig[provider as keyof typeof providerConfig];

  debug("Rendering with state:", {
    isLocalLoading,
    authState,
    isOAuthInProgress,
    isLoading,
  });

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isButtonDisabled}
      data-loading={isLoading}
      className={[
        // Base layout and spacing
        "relative flex items-center justify-center gap-3 w-full px-6 py-3 rounded-xl",
        "font-semibold text-sm tracking-wide overflow-hidden",

        // Enhanced transitions and animations
        "transition-all duration-300 ease-out transform-gpu",

        // Background with gradient and glassmorphism effect
        config.bgColor || "bg-white border-2 border-gray-200/50",

        // Text styling
        config.textColor || "text-gray-700",

        // Interactive states with improved feedback
        isButtonDisabled
          ? "opacity-60 cursor-not-allowed scale-100"
          : [
              "hover:shadow-2xl hover:shadow-blue-500/20",
              "hover:-translate-y-1 hover:scale-[1.02]",
              "active:translate-y-0 active:scale-[0.98]",
              "focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2",
              "hover:border-blue-300/60",
            ].join(" "),

        // Loading state animation
        isLoading && "animate-pulse",

        className,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()}
      style={{
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        // Subtle gradient overlay
        background: isButtonDisabled
          ? undefined
          : `linear-gradient(135deg, ${
              config.bgColor || "rgba(255, 255, 255, 0.95)"
            }, ${config.bgColor || "rgba(249, 250, 251, 0.95)"})`,
        // Subtle inset shadow for depth
        boxShadow: isButtonDisabled
          ? undefined
          : "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Shimmer effect overlay for loading state */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{
            animation: "shimmer 1.5s infinite",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      {/* Icon container with enhanced styling */}
      <div
        className={[
          "flex items-center justify-center min-w-[24px] h-6 relative z-10",
          "transition-transform duration-300 ease-out",
          isLoading ? "animate-spin" : "group-hover:scale-110",
        ].join(" ")}
      >
        {isLoading ? (
          <div className="relative">
            <LoadingSpinner
              size="sm"
              className="h-5 w-5 text-current opacity-80"
            />
            <div className="absolute inset-0 animate-ping">
              <div className="h-5 w-5 rounded-full bg-current opacity-20" />
            </div>
          </div>
        ) : (
          <config.icon className="h-5 w-5 transition-all duration-300 filter drop-shadow-sm" />
        )}
      </div>

      {/* Text with enhanced typography */}
      <span
        className={[
          "relative z-10 whitespace-nowrap select-none",
          "transition-all duration-300 ease-out",
          isLoading ? "tracking-wider" : "group-hover:tracking-wide",
        ].join(" ")}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            Connecting
            <span className="flex gap-1">
              <span
                className="w-1 h-1 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          </span>
        ) : (
          `${variant === "signup" ? "Sign up" : "Continue"} with ${config.name}`
        )}
      </span>

      {/* Subtle highlight effect */}
      {!isButtonDisabled && !isLoading && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}
<style jsx>{`
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-4px);
    }
  }
`}</style>;
