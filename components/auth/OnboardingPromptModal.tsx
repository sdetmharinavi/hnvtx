// components/auth/OnboardingPromptModal.tsx
"use client";

import { motion } from "framer-motion";
import { FiUserCheck, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/common/ui";

interface OnboardingPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToProfile: () => void;
  onDismissPermanently: () => void;
  userName?: string;
}

export const OnboardingPromptModal: React.FC<OnboardingPromptModalProps> = ({
  isOpen,
  onClose,
  onGoToProfile,
  onDismissPermanently,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:justify-end">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <FiUserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Complete Your Profile
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Welcome, {userName}! Help us get to know you better by adding a few more details.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onGoToProfile}
            className="w-full sm:flex-1"
            variant="primary"
            rightIcon={<FiArrowRight />}
          >
            Update Profile
          </Button>
          <Button
            onClick={onClose}
            className="w-full sm:flex-1"
            variant="outline"
          >
            Maybe Later
          </Button>
        </div>
        <button
          onClick={onDismissPermanently}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-4"
        >
          Don&apos;t show this again
        </button>
      </motion.div>
    </div>
  );
};