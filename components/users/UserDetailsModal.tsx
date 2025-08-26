import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiUserCheck,
  FiBriefcase,
  FiMail,
  FiShield,
  FiClock,
  FiSettings,
} from "react-icons/fi";
import { RoleBadge } from "@/components/common/ui/badges/RoleBadge";
import Image from "next/image";
import { UserRole } from "@/types/user-roles";
import { Modal } from "@/components/common/ui";
import { UserProfileData } from "@/components/users/user-types";
import { CardSpinner } from "@/components/common/ui/LoadingSpinner";
import { StatusBadge } from "@/components/common/ui/badges/StatusBadge";

type Props = {
  user: UserProfileData;
  onClose: () => void;
  isOpen: boolean;
};

type Address = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

const UserDetailsModal = ({ user, onClose, isOpen }: Props) => {
  console.log(user);

  // Helper function to format address
  const formatAddress = (address: Address) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip_code,
      address.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  };

  // Helper function to get user initials
  const getUserInitials = () => {
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || "";
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "?";
  };

  // Helper function to get full name
  const getFullName = () => {
    const firstName = user.first_name?.trim() || "";
    const lastName = user.last_name?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "No name provided";
  };

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not provided";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Helper function to format datetime
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formattedAddress = user?.address
    ? formatAddress(user?.address as Address)
    : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 30,
      transition: {
        duration: 0.2
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose}>
          {user ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                variants={modalVariants}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
              >
                {/* Enhanced Header with gradient background */}
                <div className="relative px-8 py-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <motion.div 
                      className="flex items-center gap-4"
                      variants={fieldVariants}
                    >
                      <motion.div 
                        className="flex-shrink-0 relative"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring" as const, stiffness: 300 }}
                      >
                        {user?.avatar_url ? (
                          <div className="relative">
                            <Image
                              className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-blue-500/20"
                              src={user?.avatar_url}
                              alt={getFullName()}
                              width={64}
                              height={64}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden"
                                );
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                        ) : null}
                        <div
                          className={`h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-blue-500/20 ${
                            user?.avatar_url ? "hidden" : ""
                          }`}
                        >
                          <span className="text-xl font-bold text-white">
                            {getUserInitials()}
                          </span>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                      </motion.div>
                      <div className="space-y-1">
                        <motion.h2 
                          className="text-2xl font-bold text-gray-900 dark:text-white"
                          variants={fieldVariants}
                        >
                          {getFullName()}
                        </motion.h2>
                        <motion.p 
                          className="text-gray-600 dark:text-gray-300 font-medium"
                          variants={fieldVariants}
                        >
                          {user.email}
                        </motion.p>
                        {user.designation && (
                          <motion.div 
                            className="flex items-center gap-2"
                            variants={fieldVariants}
                          >
                            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                              {user.designation}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                    <motion.button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
                      aria-label="Close modal"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring" as const, stiffness: 300 }}
                    >
                      <FiX size={24} />
                    </motion.button>
                  </div>
                </div>

                {/* Enhanced Content with better spacing */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)] custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Personal Information Section */}
                    <motion.div 
                      className="space-y-6"
                      variants={sectionVariants}
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FiUser className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Personal Information
                        </h3>
                      </div>

                      <div className="space-y-5">
                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring" as const, stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Full Name
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <p className="text-gray-900 dark:text-white font-medium">{getFullName()}</p>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring" as const, stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Email Address
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiMail className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium flex-1">{user.email}</p>
                              <motion.span
                                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                  user.is_email_verified
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                {user.is_email_verified ? "✓ Verified" : "✗ Unverified"}
                              </motion.span>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Phone Number
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiPhone className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium">
                                {user.phone_number || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Date of Birth
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiCalendar className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatDate(user.date_of_birth)}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Designation
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiBriefcase className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium">
                                {user.designation || "Not specified"}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Account Information Section */}
                    <motion.div 
                      className="space-y-6"
                      variants={sectionVariants}
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <FiUserCheck className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Account Information
                        </h3>
                      </div>

                      <div className="space-y-5">
                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Role
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiShield className="text-gray-400 flex-shrink-0" size={18} />
                              <RoleBadge role={user.role as UserRole} />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Status
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <StatusBadge status={user.status || ""} />
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Account Created
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiCalendar className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatDate(user.created_at)}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Last Sign In
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiClock className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatDateTime(user.last_sign_in_at)}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="group"
                          variants={fieldVariants}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wider">
                            Last Updated
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                            <div className="flex items-center gap-3">
                              <FiClock className="text-gray-400 flex-shrink-0" size={18} />
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatDateTime(user.updated_at)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Address Section */}
                  {formattedAddress && (
                    <motion.div 
                      className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700"
                      variants={sectionVariants}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <FiMapPin className="text-purple-600 dark:text-purple-400" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Address Information
                        </h3>
                      </div>
                      <motion.div 
                        className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring" as const, stiffness: 300 }}
                      >
                        <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
                          {formattedAddress}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Preferences Section */}
                  {user.preferences && Object.keys(user.preferences).length > 0 && (
                    <motion.div 
                      className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700"
                      variants={sectionVariants}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <FiSettings className="text-orange-600 dark:text-orange-400" size={20} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          User Preferences
                        </h3>
                      </div>
                      <motion.div 
                        className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring" as const, stiffness: 300 }}
                      >
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                          {JSON.stringify(user.preferences, null, 2)}
                        </pre>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <CardSpinner />
            </motion.div>
          )}
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default UserDetailsModal;