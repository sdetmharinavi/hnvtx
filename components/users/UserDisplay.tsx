import Image from "next/image";
import { formatUserName } from "@/utils/formatters";
import { UserProfileData } from "@/components/users/user-types";

interface UserDisplayProps {
  user: UserProfileData;
}

export function UserDisplay({ user }: UserDisplayProps) {
  return (
    <div className='flex items-center'>
      <div className='relative flex-shrink-0 h-10 w-10'>
        {user.avatar_url ? (
          <Image 
            className='h-10 w-10 rounded-full object-cover' 
            src={user.avatar_url} 
            alt={formatUserName(user.first_name || "", user.last_name || "")} 
            width={40} 
            height={40} 
          />
        ) : (
          <div className='h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-200'>
            {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
      </div>
      <div className='ml-4'>
        <div className='text-sm font-medium text-gray-900 dark:text-white'>
          {user.full_name ? user.full_name : formatUserName(user.first_name || "", user.last_name || "")}
        </div>
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          {user.email}
          <div className={`flex items-center text-xs mt-1 ${user.is_email_verified ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            {user.is_email_verified ? "✓ Verified" : "✗ Unverified"}
          </div>
        </div>
        {user.designation && <div className='text-xs text-gray-400 dark:text-gray-500'>{user.designation}</div>}
      </div>
    </div>
  );
}