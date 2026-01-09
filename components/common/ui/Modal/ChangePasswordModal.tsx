// components/common/Modal/ChangePasswordModal.tsx
import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'sonner';
import { LoadingSpinner } from '../LoadingSpinner';
import { Modal } from './Modal'; // Make sure your Modal component is correctly imported

// --- MODIFIED Type Definition ---
export interface ChangePasswordData {
  newPassword: string;
  // currentPassword is no longer needed for the API call
}

interface ChangePasswordModalProps {
  onClose: () => void;
  // This function signature now matches our store
  changePassword: (data: ChangePasswordData) => Promise<boolean>;
  isLoading: boolean;
  isOpen: boolean;
}

export const ChangePasswordModal = ({
  isOpen,
  onClose,
  changePassword,
  isLoading,
}: ChangePasswordModalProps) => {
  // --- REMOVED currentPassword state ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    // --- MODIFIED: Call the function with the new data shape ---
    const success = await changePassword({ newPassword });

    if (success) {
      toast.success('Password updated successfully!');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
        </div>
        <div className="mt-4 space-y-4">
          {/* --- REMOVED Current Password Input Block --- */}

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-0 bottom-2.5 flex items-center px-3 text-gray-400"
            >
              {showNewPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-[120px] items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
