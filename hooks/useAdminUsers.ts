import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database } from "@/types/supabase-types";
import { createClient } from "@/utils/supabase/client";
import { User_profilesInsertSchema, User_profilesUpdateSchema, V_user_profiles_extendedRowSchema } from "@/schemas/zod-schemas";


type UserCreateInput = {
  id?: string;  // This will be your custom UUID, optional as it can be auto-generated
  email: string;
  password: string;
  email_confirm?: boolean;
  first_name: string;
  last_name: string;
  role: string;
};

// Define the shape of the RPC response
type UserDataResult = {
  data: V_user_profiles_extendedRowSchema[];
  counts: {
    total: number;
    active: number;
    inactive: number;
  };
};

export type { UserCreateInput };

// Types
type AdminGetAllUsers =
  Database["public"]["Functions"]["admin_get_all_users"]["Args"];

type AdminGetAllUsersExtended =
  Database["public"]["Functions"]["admin_get_all_users_extended"]["Args"];

type AdminBulkDeleteUsersFunction =
  Database["public"]["Functions"]["admin_bulk_delete_users"]["Args"];

type AdminBulkUpdateUserRole =
  Database["public"]["Functions"]["admin_bulk_update_role"]["Args"];

type AdminBulkUpdateUserStatus =
  Database["public"]["Functions"]["admin_bulk_update_status"]["Args"];

type AdminUpdateUserProfile =
  Database["public"]["Functions"]["admin_update_user_profile"]["Args"];



// Query Keys
export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (filters: AdminGetAllUsers) =>
    [...adminUserKeys.lists(), filters] as const,
  details: () => [...adminUserKeys.all, "detail"] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
  role: () => [...adminUserKeys.all, "my-role"] as const,
  userDetails: () => [...adminUserKeys.all, "my-details"] as const,
  superAdmin: () => [...adminUserKeys.all, "super-admin"] as const,
};

// Hook to get all users with filtering and pagination
export const useAdminGetAllUsers = (params: AdminGetAllUsers = {}) => {
  const supabase = createClient();
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: async (): Promise<User_profilesInsertSchema[]> => {
      const { data, error } = await supabase.rpc("admin_get_all_users", params);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAdminGetAllUsersExtended = (params: AdminGetAllUsersExtended = {}) => {
  const supabase = createClient();
  return useQuery({
    queryKey: adminUserKeys.list(params),
    // CORRECTED: Update the query function to expect the new JSONB structure
    queryFn: async (): Promise<UserDataResult> => {
      const { data, error } = await supabase.rpc("admin_get_all_users_extended", params);

      if (error) {
        throw new Error(error.message);
      }

      // Return the structured data, providing defaults if the RPC returns null
      return {
        data: data?.data || [],
        counts: data?.counts || { total: 0, active: 0, inactive: 0 },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get user by ID
export const useAdminGetUserById = (userId: string, enabled = true) => {
  const supabase = createClient();
  return useQuery({
    queryKey: adminUserKeys.detail(userId),
    queryFn: async (): Promise<User_profilesUpdateSchema | null> => {
      const { data, error } = await supabase.rpc("admin_get_user_by_id", {
        user_id: userId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data?.[0] as User_profilesUpdateSchema || null;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get current user's role
export const useGetMyRole = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: adminUserKeys.role(),
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc("get_my_role");

      if (error) {
        throw new Error(error.message);
      }

      return data || "";
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (roles don't change often)
  });
};

// Hook to get current user's details
export const useGetMyUserDetails = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: adminUserKeys.userDetails(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_user_details");

      if (error) {
        throw new Error(error.message);
      }

      return data?.[0] as User_profilesUpdateSchema || null;
    },
    staleTime: 10 * 60 * 1000,
  });
};

// Hook to check if current user is super admin
export const useIsSuperAdmin = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: adminUserKeys.superAdmin(),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_super_admin");

      if (error) {
        throw new Error(error.message);
      }

      return data || false;
    },
    staleTime: 15 * 60 * 1000,
  });
};

// Hook to update user profile
export const useAdminUpdateUserProfile = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AdminUpdateUserProfile): Promise<boolean> => {
      const { data, error } = await supabase.rpc(
        "admin_update_user_profile",
        params
      );

      if (error) {
        throw new Error(error.message);
      }

      return data || false;
    },
    onSuccess: (_, variables) => {
      toast.success("User profile updated successfully");

      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: adminUserKeys.detail(variables.user_id),
      });
    },
    onError: (error) => {
      toast.error(`Failed to update user profile: ${error.message}`);
    },
  });
};

// Hook to bulk delete users
export const useAdminBulkDeleteUsers = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: AdminBulkDeleteUsersFunction
    ): Promise<boolean> => {
      const { data, error } = await supabase.rpc(
        "admin_bulk_delete_users",
        params
      );

      if (error) {
        throw new Error(error.message);
      }

      return data || false;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Successfully deleted ${variables.user_ids.length} user(s)`
      );

      // Invalidate all user lists
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });

      // Remove individual user queries from cache
      variables.user_ids.forEach((userId) => {
        queryClient.removeQueries({ queryKey: adminUserKeys.detail(userId) });
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete users: ${error.message}`);
    },
  });
};

// Hook to bulk update user roles
export const useAdminBulkUpdateUserRole = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AdminBulkUpdateUserRole): Promise<boolean> => {
      const { data, error } = await supabase.rpc(
        "admin_bulk_update_role",
        params
      );

      if (error) {
        throw new Error(error.message);
      }

      return data || false;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Successfully updated role for ${variables.user_ids.length} user(s)`
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });

      // Invalidate individual user details
      variables.user_ids.forEach((userId) => {
        queryClient.invalidateQueries({
          queryKey: adminUserKeys.detail(userId),
        });
      });
    },
    onError: (error) => {
      toast.error(`Failed to update user roles: ${error.message}`);
    },
  });
};

// Hook to bulk update user status
export const useAdminBulkUpdateUserStatus = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AdminBulkUpdateUserStatus): Promise<boolean> => {
      const { data, error } = await supabase.rpc(
        "admin_bulk_update_status",
        params
      );

      if (error) {
        throw new Error(error.message);
      }

      return data || false;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Successfully updated status for ${variables.user_ids.length} user(s)`
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });

      // Invalidate individual user details
      variables.user_ids.forEach((userId) => {
        queryClient.invalidateQueries({
          queryKey: adminUserKeys.detail(userId),
        });
      });
    },
    onError: (error) => {
      toast.error(`Failed to update user status: ${error.message}`);
    },
  });
};

// Hook to create a new user
export const useAdminCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UserCreateInput) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      console.error("User creation error:", error);
      toast.error(error.message || "Failed to create user");
    },
  });
};


// Combined hook for multiple operations
interface UserOperations {
  createUser: ReturnType<typeof useAdminCreateUser>;
  updateUser: ReturnType<typeof useAdminUpdateUserProfile>;
  deleteUsers: ReturnType<typeof useAdminBulkDeleteUsers>;
  updateUserRoles: ReturnType<typeof useAdminBulkUpdateUserRole>;
  updateUserStatus: ReturnType<typeof useAdminBulkUpdateUserStatus>;
  isLoading: boolean;
}

export const useAdminUserOperations = (): UserOperations => {
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
    isLoading: createUser.isPending || 
               updateUser.isPending || 
               deleteUsers.isPending || 
               updateUserRoles.isPending || 
               updateUserStatus.isPending
  };
};