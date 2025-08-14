import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiUser, 
  FiPhone, 
  FiCalendar, 
  FiMapPin,
  FiSave,
  FiX,
  FiCamera,
  FiShield
} from 'react-icons/fi'
import { 
  useAdminGetUserById, 
  useAdminUpdateUserProfile,
  useGetMyRole,
  useIsSuperAdmin
} from '@/hooks/useAdminUsers'
import { toast } from 'sonner'
import { UserRole } from '@/types/user-roles'
import { Json } from '@/types/supabase-types'
import Image from 'next/image'

// Define Address as a type that can be serialized to JSON
type Address = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

interface UserPreferences {
  [key: string]: string | number | boolean
}

interface FormData {
  first_name: string
  last_name: string
  avatar_url: string
  phone_number: string
  date_of_birth: string | null
  address: Address | null,
  preferences: UserPreferences
  role: UserRole
  designation: string
  status: string
}

interface UpdateParams {
  user_id: string
  update_first_name?: string
  update_last_name?: string
  update_avatar_url?: string
  update_phone_number?: string
  update_date_of_birth?: string
  update_address?: Json
  update_preferences?: UserPreferences
  update_role?: UserRole
  update_designation?: string
  update_status?: string
}

interface UserProfileEditProps {
  userId: string
  onClose: () => void
  onSave?: () => void
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ 
  userId, 
  onClose, 
  onSave 
}) => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    avatar_url: '',
    phone_number: '',
    date_of_birth: '',
    address: null,
    preferences: {},
    role: UserRole.AUTHENTICATED,
    designation: '',
    status: ''
  })
  
  const [isFormDirty, setIsFormDirty] = useState(false)

  // Hooks
  const { data: user, isLoading: isLoadingUser } = useAdminGetUserById(userId)
  const { data: currentUserRole } = useGetMyRole()
  const { data: isSuperAdmin } = useIsSuperAdmin()
  const updateProfile = useAdminUpdateUserProfile()



  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        avatar_url: user?.avatar_url || '',
        phone_number: user?.phone_number || '',
        date_of_birth: user?.date_of_birth?.split('T')[0] || null,
        address: (user.address as Address) || null,
        preferences: (user.preferences as UserPreferences) || {},
        role: (user.role as UserRole) || 'user',
        designation: user?.designation || '',
        status: user?.status || 'active'
      })
    }
  }, [user])

  // Handle form changes

  const handleInputChange = (field: keyof FormData, value: string | UserRole | null) => {
    // Validate date format if needed
    if (field === 'date_of_birth') {
      // Convert empty string to null for database
      value = value === '' ? null : value;
      
      // Optional: Validate date format
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        console.warn('Invalid date format');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setIsFormDirty(true);
  };

  // Handle address changes
  const handleAddressChange = (field: keyof NonNullable<Address>, value: string) => {
    setFormData(prev => {
      const currentAddress = prev.address || {};
      const newAddress = {
        ...currentAddress,
        [field]: value || undefined // Convert empty strings to undefined
      };
      return {
        ...prev,
        address: newAddress
      };
    });
    setIsFormDirty(true);
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormDirty) {
      toast.info('No changes to save')
      return
    }

    if (!user) {
      toast.error('User data not available')
      return
    }

    try {
      const updateParams: UpdateParams = {
        user_id: userId
      }

      // Only include changed fields
      if (formData.first_name !== user.first_name) {
        updateParams.update_first_name = formData.first_name
      }
      if (formData.last_name !== user.last_name) {
        updateParams.update_last_name = formData.last_name
      }
      if (formData.avatar_url !== user.avatar_url) {
        updateParams.update_avatar_url = formData.avatar_url
      }
      if (formData.phone_number !== user.phone_number) {
        updateParams.update_phone_number = formData.phone_number
      }
      if (formData.date_of_birth !== user.date_of_birth?.split('T')[0]) {
        // Convert null to undefined to match the expected type
        updateParams.update_date_of_birth = formData.date_of_birth || undefined
      }
      if (JSON.stringify(formData.address) !== JSON.stringify(user.address)) {
        updateParams.update_address = formData.address
      }
      if (JSON.stringify(formData.preferences) !== JSON.stringify(user.preferences)) {
        updateParams.update_preferences = formData.preferences
      }
      if (formData.role !== user.role && (isSuperAdmin || currentUserRole === 'admin')) {
        updateParams.update_role = formData.role
      }
      if (formData.designation !== user.designation) {
        updateParams.update_designation = formData.designation
      }
      if (formData.status !== user.status && (isSuperAdmin || currentUserRole === 'admin')) {
        updateParams.update_status = formData.status
      }

      await updateProfile.mutateAsync(updateParams)
      setIsFormDirty(false)
      toast.success('Profile updated successfully')
      onSave?.()
      onClose()
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    }
  }

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (isFormDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirmed) return
    }
    onClose()
  }

  if (isLoadingUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-center">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-600 mb-4">The user you&apos;re trying to edit could not be found.</p>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiUser className="text-blue-600 text-xl" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit User Profile</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {formData.avatar_url ? (
                  <Image
                    src={formData.avatar_url}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {formData.first_name?.[0]}{formData.last_name?.[0]}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <FiCamera size={12} />
                </button>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiPhone className="inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiCalendar className="inline mr-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior Developer, Product Manager"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiMapPin className="inline mr-1" />
                Address
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street Address"
                />
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={formData.address?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State/Province"
                />
                <input
                  type="text"
                  value={formData.address?.zip_code || ''}
                  onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ZIP/Postal Code"
                />
              </div>
            </div>

            {/* Admin-only fields */}
            {(isSuperAdmin || currentUserRole === 'admin') && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiShield className="text-orange-600" />
                  <h3 className="text-lg font-medium text-gray-900">Administrative Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {isFormDirty && '• Unsaved changes'}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormDirty || updateProfile.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSave />
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default UserProfileEdit