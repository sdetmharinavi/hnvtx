// path: components/auth/ForgotPasswordForm.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiLoader, FiCheck } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/validationUtils';
import { ButtonSpinner } from '../common/ui/LoadingSpinner';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // THE FIX: Use component state instead of localStorage to manage UI flow.
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const { forgotPassword } = useAuth();

  const validateEmail = isValidEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!validateEmail) {
      setError('Invalid email format');
      return;
    }

    setIsLoading(true);
    const { success, error: responseError } = await forgotPassword(email);
    setIsLoading(false);

    if (success) {
      setSentToEmail(email);
      setIsEmailSent(true); // Switch to the confirmation view
      setEmail('');
      setError('');
    } else {
      setError(responseError?.message || 'Failed to send reset email.');
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');
    if (sentToEmail) {
      await forgotPassword(sentToEmail);
    }
    setIsLoading(false);
  };

  const clearResetState = () => {
    setIsEmailSent(false);
    setSentToEmail('');
  };

  if (isEmailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">{sentToEmail}</span>.
            </p>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <FiLoader className="animate-spin mr-2" />
                    Resending...
                  </div>
                ) : (
                  'Resend Email'
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearResetState}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Use a different email address
              </motion.button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password?</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed"
          >
            {isLoading ? <ButtonSpinner /> : 'Send Reset Link'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
