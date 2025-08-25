import { motion } from 'framer-motion'
import {
  FiEdit3,
  FiMapPin,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUserCheck,
  FiBriefcase,
} from 'react-icons/fi'
import { useAdminGetUserById } from '@/hooks/useAdminUsers'
import StatusBadge from '@/components/users/StatusBadge'
import RoleBadge from '@/components/users/RoleBadge'
import Image from 'next/image'
import { UserRole } from '@/types/user-roles'
import { Modal } from '@/components/common/ui'
import { UserProfile } from '@/schemas'

type Props = {
  user: UserProfile | null
  onClose: () => void
  isOpen: boolean
}

type Address = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

const UserDetailsModal = ({ user, onClose, isOpen }: Props) => {
  console.log(user);
  

  // if (!user) {
  //   return (
  //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  //       <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
  //         <div className="text-red-500 text-5xl mb-4">⚠️</div>
  //         <h3 className="text-lg font-medium text-gray-900 mb-2">
  //           User Not Found
  //         </h3>
  //         <button
  //           onClick={onClose}
  //           className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
  //         >
  //           Close
  //         </button>
  //       </div>
  //     </div>
  //   )
  // }

  // Helper function to format address
  const formatAddress = (address: Address) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip_code,
      address.country
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : null
  }

  // Helper function to get user initials
  const getUserInitials = () => {
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || ''
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || ''
    return firstInitial + lastInitial || '?'
  }

  // Helper function to get full name
  const getFullName = () => {
    const firstName = user.first_name?.trim() || ''
    const lastName = user.last_name?.trim() || ''
    const fullName = `${firstName} ${lastName}`.trim()
    return fullName || 'No name provided'
  }

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  // Helper function to format datetime
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const formattedAddress = user.address ? formatAddress(user.address as Address) : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <Image
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                  src={user.avatar_url}
                  alt={getFullName()}
                  width={40}
                  height={40}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ${user.avatar_url ? 'hidden' : ''}`}>
                <span className="text-lg font-medium text-blue-700">
                  {getUserInitials()}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getFullName()}
              </h2>
              {/* <p className="text-sm text-gray-500">{user.email}</p> */}
              {user.designation && (
                <p className="text-xs text-blue-600 font-medium">{user.designation}</p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FiUser className="text-blue-600" />
                Personal Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Full Name</label>
                  <p className="text-gray-900">{getFullName()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Email Address</label>
                  {/* <div className="flex items-center gap-2">
                    <FiMail className="text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900">{user.email}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.is_email_verified 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_email_verified ? '✓ Verified' : '✗ Unverified'}
                    </span>
                  </div> */}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900">{user.phone_number || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Date of Birth</label>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900">{formatDate(user.date_of_birth)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Designation</label>
                  <div className="flex items-center gap-2">
                    <FiBriefcase className="text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900">{user.designation || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FiUserCheck className="text-green-600" />
                Account Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Role</label>
                  <RoleBadge role={user.role as UserRole} />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Status</label>
                  <StatusBadge status={user.status} />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Account Created</label>
                  <p className="text-gray-900">{formatDate(user.created_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Last Sign In</label>
                  <p className="text-gray-900">{formatDateTime(user.last_sign_in_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Last Updated</label>
                  <p className="text-gray-900">{formatDateTime(user.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          {formattedAddress && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiMapPin className="text-blue-600" />
                Address Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">{formattedAddress}</p>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {user.preferences && Object.keys(user.preferences).length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Preferences</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(user.preferences, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiEdit3 size={16} />
            Edit User
          </button>
        </div>
      </motion.div>
    </div>
    </Modal>
  )
}

export default UserDetailsModal