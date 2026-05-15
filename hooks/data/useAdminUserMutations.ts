// hooks/data/useAdminUserMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Database } from '@/types/supabase-types';
import { createClient } from '@/utils/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { invalidateRelatedCaches } from '@/hooks/database/cache-performance';

export type UserCreateInput = {
  id?: string;
  email: string;
  password: string;
  email_confirm?: boolean;
  first_name: string;
  last_name: string;
  role: string;
};

export type AdminUpdateUserProfile =
  Database['public']['Functions']['admin_update_user_profile']['Args'];

export const useAdminUpdateUserProfile = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: AdminUpdateUserProfile): Promise<boolean> => {
      if (!isOnline) throw new Error('User profile updates require an online connection.');
      const { data, error } = await supabase.rpc('admin_update_user_profile', params);
      if (error) throw new Error(error.message);
      return data || false;
    },
    onSuccess: () => {
      toast.success('User profile updated successfully');
      invalidateRelatedCaches(queryClient, 'user_profiles');
    },
    onError: (error) => toast.error(`Failed to update user profile: ${error.message}`),
  });
};

export const useAdminBulkDeleteUsers = () => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: { user_ids: string[] }): Promise<void> => {
      if (!isOnline) throw new Error('Deleting users requires an online connection.');
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: params.user_ids }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete users.');
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully deleted ${variables.user_ids.length} user(s)`);
      invalidateRelatedCaches(queryClient, 'user_profiles');
    },
    onError: (error) => toast.error(`Failed to delete users: ${error.message}`),
  });
};

export const useAdminBulkUpdateUserRole = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: { user_ids: string[]; new_role: string }): Promise<boolean> => {
      if (!isOnline) throw new Error('Updating roles requires an online connection.');
      const { data, error } = await supabase.rpc('admin_bulk_update_role', params);
      if (error) throw new Error(error.message);
      return data || false;
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated role for ${variables.user_ids.length} user(s)`);
      invalidateRelatedCaches(queryClient, 'user_profiles');
    },
    onError: (error) => toast.error(`Failed to update user roles: ${error.message}`),
  });
};

export const useAdminBulkUpdateUserStatus = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: { user_ids: string[]; new_status: string }): Promise<boolean> => {
      if (!isOnline) throw new Error('Updating status requires an online connection.');
      const { data, error } = await supabase.rpc('admin_bulk_update_status', params);
      if (error) throw new Error(error.message);
      return data || false;
    },
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated status for ${variables.user_ids.length} user(s)`);
      invalidateRelatedCaches(queryClient, 'user_profiles');
    },
    onError: (error) => toast.error(`Failed to update user status: ${error.message}`),
  });
};

export const useAdminCreateUser = () => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (userData: UserCreateInput) => {
      if (!isOnline) throw new Error('Creating users requires an online connection.');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      return data;
    },
    onSuccess: () => {
      invalidateRelatedCaches(queryClient, 'user_profiles');
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      console.error('User creation error:', error);
      toast.error(error.message || 'Failed to create user');
    },
  });
};

export const useAdminUserOperations = () => {
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUserProfile();
  const deleteUsers = useAdminBulkDeleteUsers();
  const updateUserRoles = useAdminBulkUpdateUserRole();
  const updateUserStatus = useAdminBulkUpdateUserStatus();

  return {
    createUser,
    updateUser,
    deleteUsers,
    updateUserRoles,
    updateUserStatus,
    isLoading:
      createUser.isPending ||
      updateUser.isPending ||
      deleteUsers.isPending ||
      updateUserRoles.isPending ||
      updateUserStatus.isPending,
  };
};
