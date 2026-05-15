'use client';
import Link from 'next/link';
import { useEffect } from 'react'; // IMPORTED
import { useRouter } from 'next/navigation'; // IMPORTED
import OnboardingFormEnhanced from './onboarding-form-enhanced';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/providers/UserProvider';
import { FiRefreshCw } from 'react-icons/fi';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { logout } = useAuth();
  const { profile, isLoading, refetch } = useUser();
  const router = useRouter(); // INITIALIZED

  // THE FIX: Add guard to redirect already onboarded users.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preferences = profile?.preferences as any;
    if (!isLoading && profile && preferences?.needsOnboarding === false) {
      toast.info("Your profile is already complete. Redirecting to dashboard...");
      router.push('/dashboard');
    }
  }, [profile, isLoading, router]);

  const handleRefresh = async () => {
    await refetch();
    toast.success('Profile refreshed!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Update Your Profile</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
            title="Refresh Profile"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Centered Form */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <OnboardingFormEnhanced />
        </div>
      </div>
    </div>
  );
}