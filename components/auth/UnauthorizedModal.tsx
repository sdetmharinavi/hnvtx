// components/auth/UnauthorizedModal.tsx
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/user-roles";

interface UnauthorizedModalProps {
  allowedRoles: UserRole[];
  currentRole?: string | null;
}

export const UnauthorizedModal: React.FC<UnauthorizedModalProps> = ({ 
  allowedRoles, 
  currentRole 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  // Auto-close modal and redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Redirect to dashboard or home page
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    router.back();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const formatRole = (role: UserRole) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 z-10">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Access Denied
        </h3>

        {/* Message */}
        <div className="text-sm text-gray-600 text-center mb-6">
          <p className="mb-3">
            You don&apos;t have permission to access this page.
          </p>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="font-medium text-gray-700 mb-1">Required roles:</p>
            <p className="text-gray-600">
              {allowedRoles.map(formatRole).join(", ")}
            </p>
            {currentRole && (
              <>
                <p className="font-medium text-gray-700 mt-2 mb-1">Your current role:</p>
                <p className="text-gray-600">{currentRole}</p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoBack}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Auto-close notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This modal will auto-close in 5 seconds
        </p>
      </div>
    </div>
  );
};