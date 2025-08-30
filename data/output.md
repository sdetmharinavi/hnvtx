<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useCrudManager copy.ts -->
```typescript
"use client";

import { useState,  useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/utils/supabase/client";
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  Filters,
  TableName,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
} from "@/hooks/database";
import { toast } from "sonner";
import { useDeleteManager } from "./useDeleteManager";

// --- TYPE DEFINITIONS for the Hook's Interface ---
// A generic type to ensure records passed to actions have an 'id' and optionally a 'name'
export type RecordWithId = {
  id: string | number | null;  // Allow null to match database schema
  system_id?: string | number | null;
  system_connection_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  [key: string]: unknown;
};

// Parameters that the manager will pass to the data fetching hook
export interface DataQueryHookParams {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  filters: Filters;
}

export interface DataQueryHookReturn<V> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;

// *** THE FIX IS HERE: `id` is now `string | null` to match your view's type. ***
type BaseRecord = { id: string | null; [key: string]: unknown };

// Options to configure the manager
// *** THE FIX IS HERE: The constraint is now simpler and correct. ***
// V only needs to be a base record with an `id`. T is still the TableName.
export interface CrudManagerOptions<T extends TableName, V extends BaseRecord> {
  tableName: T;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: keyof V & string;
}


// --- THE HOOK ---

export function useCrudManager<T extends TableName, V extends BaseRecord>({
  tableName,
  dataQueryHook,
}: CrudManagerOptions<T, V>) {
  const supabase = createClient();

  // The state for editing/viewing records should use the View type `V`
  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  // ... (the rest of the state remains the same)
  // --- STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // <-- NEW state for view modal
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // --- DATA FETCHING (Delegated to the injected hook) ---
  const { data, totalCount, activeCount, inactiveCount, isLoading, error, refetch } = dataQueryHook({
    currentPage,
    pageLimit,
    searchQuery: debouncedSearch,
    filters,
  });

  // --- MUTATIONS (Target the base table `T`) ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record created.");
      },
    }
  );
  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record updated.");
      },
    }
  );
  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: refetch,
  });
  const deleteManager = useDeleteManager({ tableName, onSuccess: refetch });
  const { bulkDelete, bulkUpdate } = useTableBulkOperations(
    supabase,
    tableName
  );

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending;

  // --- HANDLERS ---
  const openAddModal = useCallback(() => {
    setEditingRecord(null);
    setIsEditModalOpen(true);
  }, []);
  const openEditModal = useCallback((record: V) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  }, []);
  const openViewModal = useCallback((record: V) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
    setIsViewModalOpen(false);
    setViewingRecord(null);
  }, []);

  const handleSave = useCallback(
    (formData: TableInsertWithDates<T>) => {
      // Convert ISO date strings back to Date objects for the database
      const processedData = { ...formData };

      // Handle date fields - adjust these field names as needed
      const dateFields = [
        "employee_dob",
        "employee_doj",
        "created_at",
        "updated_at",
      ] as const;

      dateFields.forEach((field) => {
        const fieldKey = field as keyof typeof processedData;
        if (field in processedData && processedData[fieldKey]) {
          const dateValue = processedData[fieldKey] as string | Date;
          (processedData as TableInsertWithDates<T>)[fieldKey] = new Date(
            dateValue
          ) as unknown as TableInsertWithDates<T>[typeof fieldKey];
        }
      });

      if (editingRecord && "id" in editingRecord && editingRecord.id) {
        updateItem({
          id: String(editingRecord.id),
          data: processedData as TableUpdate<T>,
        });
      } else {
        insertItem(processedData as TableInsert<T>);
      }
    },
    [editingRecord, insertItem, updateItem]
  );

  const handleDelete = useCallback(
    (record: RecordWithId) => {
      deleteManager.deleteSingle({
        id: String(record.id),
        name:
          (record.name ? record.name : record.first_name) || String(record.id),
      });
    },
    [deleteManager]
  );

  const handleToggleStatus = useCallback(
    (record: RecordWithId & { status?: boolean | null }) => {
      toggleStatus({
        id: String(record.id),
        status: !(record.status ?? false),
      });
    },
    [toggleStatus]
  );

  // Bulk action handlers
  const handleRowSelect = useCallback(
    (rows: Array<V & { id?: string | number }>) => {
      setSelectedRowIds(
        rows.map((r) => r.id).filter((id): id is string => !!id)
      );
    },
    []
  );
  const handleClearSelection = useCallback(() => setSelectedRowIds([]), []);
  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedRowIds.length} selected records?`
      )
    ) {
      bulkDelete.mutate(
        { ids: selectedRowIds },
        {
          onSuccess: () => {
            toast.success(`${selectedRowIds.length} records deleted.`);
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) => toast.error(`Bulk delete failed: ${err.message}`),
        }
      );
    }
  }, [selectedRowIds, bulkDelete, refetch]);

  const handleBulkUpdateStatus = useCallback(
    (status: "active" | "inactive") => {
      if (selectedRowIds.length === 0) return;
      const updates = selectedRowIds.map((id) => ({
        id,
        data: { status: status === "active" } as unknown as TableUpdate<T>,
      }));
      bulkUpdate.mutate(
        { updates },
        {
          onSuccess: () => {
            toast.success(`${selectedRowIds.length} records updated.`);
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) =>
            toast.error(`Bulk status update failed: ${err.message}`),
        }
      );
    },
    [selectedRowIds, bulkUpdate, refetch]
  );

  // --- RETURN VALUE ---
  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    isMutating,
    refetch,
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    editModal: { isOpen: isEditModalOpen, record: editingRecord, openAdd: openAddModal, openEdit: openEditModal, close: closeModal },
    viewModal: { isOpen: isViewModalOpen, record: viewingRecord, open: openViewModal, close: closeModal },
    actions: { handleSave, handleDelete, handleToggleStatus },
    bulkActions: { selectedRowIds, selectedCount: selectedRowIds.length, handleBulkDelete, handleBulkUpdateStatus, handleClearSelection, handleRowSelect },
    deleteModal: { isOpen: deleteManager.isConfirmModalOpen, message: deleteManager.confirmationMessage, confirm: deleteManager.handleConfirm, cancel: deleteManager.handleCancel, isLoading: deleteManager.isPending },
  };
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useOutdatedBrowserCheck.tsx -->
```typescript
import { useEffect, useState } from 'react';

const LOCAL_KEY = 'isOutdatedBrowser';

function detectOutdatedBrowser(): boolean {
  const ua = navigator.userAgent;
  let isOutdated = false;

  const isIE = /MSIE|Trident/.test(ua);
  const legacyEdgeMatch = ua.match(/Edge\/(\d+)/);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).+Safari/);
  const edgeMatch = ua.match(/Edg\/(\d+)/);

  if (isIE) {
    isOutdated = true;
  } else if (legacyEdgeMatch) {
    const version = parseInt(legacyEdgeMatch[1]);
    if (version < 80) isOutdated = true;
  } else if (chromeMatch) {
    const version = parseInt(chromeMatch[1]);
    if (version < 110) isOutdated = true;
  } else if (firefoxMatch) {
    const version = parseInt(firefoxMatch[1]);
    if (version < 100) isOutdated = true;
  } else if (safariMatch) {
    const version = parseInt(safariMatch[1]);
    if (version < 15) isOutdated = true;
  } else if (edgeMatch) {
    const version = parseInt(edgeMatch[1]);
    if (version < 110) isOutdated = true;
  }

  const missingFeatures = [
    () => typeof Promise !== 'function' || typeof Symbol !== 'function',
    () => !CSS.supports('display', 'flex'),
    () => !CSS.supports('position', 'sticky'),
    () => !CSS.supports('backdrop-filter', 'blur(1px)'),
    () => typeof IntersectionObserver === 'undefined',
    () => typeof localStorage === 'undefined',
    () => typeof sessionStorage === 'undefined',
  ].some(fn => fn());

  return isOutdated || missingFeatures;
}

export function useOutdatedBrowserCheck(): boolean | null {
  const [isOutdated, setIsOutdated] = useState<boolean | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached !== null) {
      setIsOutdated(cached === 'true');
      return;
    }

    const result = detectOutdatedBrowser();
    localStorage.setItem(LOCAL_KEY, String(result));
    setIsOutdated(result);
  }, []);

  return isOutdated;
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useEntityManagement.ts -->
```typescript
"use client";

import { BaseEntity, EntityWithChildren, isHierarchicalEntity, UseEntityManagementProps } from "@/components/common/entity-management/types";
import { useMemo, useState } from "react";

export function useEntityManagement<T extends BaseEntity>({ entitiesQuery, config, onEdit, onDelete, onToggleStatus, onCreateNew }: UseEntityManagementProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  const allEntities = entitiesQuery.data || [];

  // Search functionality
  const searchedEntities = useMemo(() => {
    if (!searchTerm) return allEntities;

    return allEntities.filter((entity) =>
      config.searchFields.some((field) => {
        const value = entity[field];
        return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [allEntities, searchTerm, config.searchFields]);

  // Filter functionality
  const filteredEntities = useMemo(() => {
    return searchedEntities.filter((entity) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        const entityValue = (entity as any)[key];
        if (key === "status") {
          return entityValue.toString() === value;
        }
        return entityValue === value;
      });
    });
  }, [searchedEntities, filters]);

  // Build hierarchical structure for tree view
  const hierarchicalEntities = useMemo((): EntityWithChildren<T>[] => {
    if (!config.isHierarchical) return filteredEntities.map((entity) => ({ ...entity, children: [] }));

    // Create a map to store entities with their children
    const entityMap = new Map<string, EntityWithChildren<T>>();

    // Initialize all entities with empty children arrays
    filteredEntities.forEach((entity) => {
      entityMap.set(entity.id, { ...entity, children: [] });
    });

    const rootEntities: EntityWithChildren<T>[] = [];

    // Build the hierarchy
    filteredEntities.forEach((entity) => {
      const entityWithChildren = entityMap.get(entity.id);
      if (!entityWithChildren) return;

      if (isHierarchicalEntity(entity) && entity.parent_id) {
        // This entity has a parent, add it to parent's children
        const parent = entityMap.get(entity.parent_id);
        if (parent) {
          parent.children.push(entityWithChildren);
        } else {
          // Parent not in filtered results, treat as root
          rootEntities.push(entityWithChildren);
        }
      } else {
        // This is a root entity
        rootEntities.push(entityWithChildren);
      }
    });

    return rootEntities;
  }, [filteredEntities, config.isHierarchical]);

  const selectedEntity = allEntities.find((entity) => entity.id === selectedEntityId) || null;

  // Event handlers
  const handleEntitySelect = (id: string) => {
    setSelectedEntityId(id);
    setShowDetailsPanel(true);
  };

  const toggleExpanded = (id: string) => {
    setExpandedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenCreateForm = () => {
    onCreateNew();
  };

  const handleOpenEditForm = () => {
    if (selectedEntity) {
      onEdit(selectedEntity);
    }
  };

  return {
    // State
    searchTerm,
    viewMode,
    showFilters,
    filters,
    selectedEntityId,
    showDetailsPanel,
    expandedEntities,

    // Computed data
    allEntities,
    filteredEntities,
    hierarchicalEntities,
    selectedEntity,

    // Handlers
    setSearchTerm,
    setViewMode,
    setShowFilters,
    setFilters,
    setShowDetailsPanel,
    handleEntitySelect,
    toggleExpanded,
    handleOpenCreateForm,
    handleOpenEditForm,
    onToggleStatus,
    onDelete,
  };
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useDelete.ts -->
```typescript
import { useState } from "react";
import { useTableDelete } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { TableName } from "@/hooks/database";

export const useDelete = ({ tableName, onSuccess }: { tableName: TableName; onSuccess?: () => void }) => {
  const supabase = createClient();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const { mutate: deleteMutation, isPending } = useTableDelete(supabase, tableName as TableName, {
    onSuccess: () => {
      onSuccess?.();
      setItemToDelete(null);
    },
  });

  const deleteSingle = (item: { id: string; name: string }) => {
    setItemToDelete(item);
  };

  const handleConfirm = () => {
    if (itemToDelete) {
      deleteMutation(itemToDelete.id);
    }
  };

  const handleCancel = () => {
    setItemToDelete(null);
  };

  return {
    isConfirmModalOpen: itemToDelete !== null,
    isPending,
    itemToDelete,
    confirmationMessage: `Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`,
    deleteSingle,
    handleConfirm,
    handleCancel,
  };
};
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useAuth.ts -->
```typescript
// hooks/useAuth.ts
"use client";

import { useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Auth Hook
export const useAuth = () => {
  const { user, authState, setUser, setAuthState, logout: logoutStore, executeWithLoading, isAuthenticated, isLoading, getUserId } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);

  // Initialize auth state - runs only once
  useEffect(() => {
    let isMounted = true;
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    }).data.subscription;

    const initAuth = async () => {
      try {
        // First try to get existing session without forcing refresh
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user) {
          if (isMounted) setUser(existingSession.user);
          return;
        }

        // Only force refresh if no existing session
        const { data: { session }, error } = await supabase.auth.refreshSession();

        if (error) {
          if (isMounted) setAuthState("unauthenticated");
          return;
        }

        if (session?.user && isMounted) {
          setUser(session.user);
        } else if (isMounted) {
          setAuthState("unauthenticated");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to initialize auth:", error instanceof Error ? error.message : "Unknown error");
          setAuthState("unauthenticated");
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, setUser, setAuthState]);

  // Memoized auth methods
  const signUp = useCallback(async (credentials: { email: string; password: string; firstName: string; lastName: string }) => {
    return executeWithLoading(async () => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              first_name: credentials.firstName,
              last_name: credentials.lastName,
            },
          },
        });

        if (error) throw error;
        if (data.user && !data.session) {
          toast.success("Signup successful! Please check your email for verification.");
        }
        return { data, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup failed";
        toast.error(message);
        return { data: null, error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    return executeWithLoading(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully!");
        return { data, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sign in failed";
        toast.error(message);
        return { data: null, error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    return executeWithLoading(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
        toast.success("Check your email for the magic link!");
        return { data, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send magic link";
        toast.error(message);
        return { data: null, error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo: `${window.location.origin}/auth/callback`,
          // Skip browser redirect to prevent page reload
          skipBrowserRedirect: true
        },
      });
      
      if (error) throw error;
      
      // If we have a URL, perform the redirect manually
      if (data?.url) {
        window.location.href = data.url;
      }
      
      return { data, error: null };
    } catch (error) {
      sessionStorage.removeItem('oauth_in_progress');
      const message = error instanceof Error ? error.message : "Google sign in failed";
      toast.error(message);
      return { data: null, error: message };
    }
  }, [supabase.auth]);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logoutStore();
      toast.success("Signed out successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logout failed";
      toast.error(message);
      logoutStore();
      throw error;
    }
  }, [supabase.auth, logoutStore]);

  const forgotPassword = useCallback(async (email: string) => {
    return executeWithLoading(async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        return { error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send reset email";
        toast.error(message);
        return { error: message };
      } finally {
        setAuthState("unauthenticated");
      }
    });
  }, [executeWithLoading, supabase.auth, setAuthState]);

  const resetPassword = useCallback(async (newPassword: string) => {
    return executeWithLoading(async () => {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Password updated successfully!");
        return { error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password update failed";
        toast.error(message);
        return { error: message };
      }
    });
  }, [executeWithLoading, supabase.auth]);

  const syncSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Session sync error:", error);
        return false;
      }
      if (session?.user) {
        setUser(session.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to sync session:", error);
      return false;
    }
  }, [supabase.auth, setUser]);

  const checkSession = useCallback(async () => {
    return executeWithLoading(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      return session;
    });
  }, [executeWithLoading, supabase.auth, setUser]);

  // Memoize the entire return value
  return useMemo(() => ({
    // State
    user,
    authState,
    isLoading: isLoading(),
    isAuthenticated: isAuthenticated(),
    userId: getUserId(),

    // Actions
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    syncSession,
    checkSession,
  }), [
    user,
    authState,
    isLoading,
    isAuthenticated,
    getUserId,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    logout,
    forgotPassword,
    resetPassword,
    syncSession,
    checkSession
  ]);
};
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useOfcConnection.ts -->
```typescript
import { useCallback, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usePagedOfcCablesComplete,
  usePagedOfcConnectionsComplete,
} from './database';
import { useSorting, SortDirection } from '@/hooks/useSorting';

type OfcConnection =
  Database['public']['Tables']['ofc_connections']['Insert'] & {
    id?: string;
  };

interface UseOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  // pagination and sorting options
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  // optional server-side search query
  search?: string;
  // NEW: Optional client-side sorting enhancement
  enableClientSorting?: boolean;
}

// Define sortable keys for better type safety (optional)
type OfcConnectionSortableKeys =
  | 'fiber_no_sn'
  | 'connection_type'
  | 'connection_category'
  | 'status'
  | 'destination_port'
  | 'source_port'
  | 'en_power_dbm'
  | 'sn_power_dbm'
  | 'route_loss_db'
  | 'created_at'
  | 'updated_at';

export const useOfcConnection = ({
  supabase,
  cableId,
  limit = 10,
  offset = 0,
  orderBy = 'fiber_no_sn',
  orderDir = 'asc',
  search,
  enableClientSorting = false, // Default to false to maintain existing behavior
}: UseOfcConnectionProps) => {
  const queryClient = useQueryClient();

  const { data: cable, isLoading: isLoadingCable } = usePagedOfcCablesComplete(
    supabase,
    {
      filters: { id: cableId },
      limit: 1,
      offset: 0,
    }
  );

  // Get existing connections for this cable with pagination
  const {
    data: rawConnections = [],
    isLoading: isLoadingOfcConnections,
    refetch: refetchOfcConnections,
  } = usePagedOfcConnectionsComplete(supabase, {
    filters: { ofc_id: cableId, ...(search ? { search } : {}) },
    limit,
    offset,
    orderBy,
    orderDir,
  });

  // Extract counts and debug info
  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    if (rawConnections && rawConnections.length > 0) {
      return {
        totalCount: rawConnections[0]?.total_count || 0,
        activeCount: rawConnections[0]?.active_count || 0,
        inactiveCount: rawConnections[0]?.inactive_count || 0,
      };
    }
    return { totalCount: 0, activeCount: 0, inactiveCount: 0 };
  }, [rawConnections]);

  // NEW: Optional client-side sorting (only used if enabled)
  const {
    sortedData: clientSortedConnections,
    sortConfig,
    handleSort,
    resetSort,
    isSorted,
    getSortDirection,
  } = useSorting({
    data: rawConnections || [], // Handle null case
    defaultSortKey: orderBy,
    defaultDirection: orderDir as SortDirection,
    options: {
      caseSensitive: false,
      numericSort: true,
    },
  });

  // Return the appropriate data based on sorting preference
  const existingConnections = useMemo(() => {
    const connections = rawConnections || [];
    return enableClientSorting ? clientSortedConnections : connections;
  }, [enableClientSorting, clientSortedConnections, rawConnections]);

  // NEW: Enhanced sort handler (optional, only exposed if client sorting is enabled)
  const handleSortColumn = useCallback(
    (key: OfcConnectionSortableKeys) => {
      if (!enableClientSorting) {
        console.warn(
          'Client-side sorting is disabled. Use server-side orderBy/orderDir props instead.'
        );
        return;
      }
      handleSort(key);
    },
    [enableClientSorting, handleSort]
  );

  // Mutation for creating new connections (unchanged)
  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: OfcConnection[]) => {
      const { data, error } = await supabase
        .from('ofc_connections')
        .insert(newConnections);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections query after successful insertion
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      refetchOfcConnections();
    },
  });

  // createMissingConnections (unchanged)
  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable || !cable[0]) return;

    // Get fresh connection count to avoid stale data
    const { data: currentConnections, error } = await supabase
      .from('ofc_connections')
      .select('id')
      .eq('ofc_id', cableId);

    if (error) {
      console.error('Failed to fetch current connections:', error);
      throw error;
    }

    const currentConnectionCount = currentConnections?.length || 0;
    const cableCapacity = cable[0].capacity as number;
    const missingCount = cableCapacity - currentConnectionCount;

    if (missingCount <= 0) {
      console.log('No missing connections to create');
      return;
    }

    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: OfcConnection = {
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        connection_type: 'straight', // Or a default value
        connection_category: 'OFC_JOINT_TYPES', // Or a default value
        status: true,
        // --- All optional fields are explicitly set to null for clarity ---
        system_id: null, // <-- The only missing field, now added
        destination_port: null,
        source_port: null,
        en_dom: null,
        en_power_dbm: null,
        fiber_no_en: null,
        logical_path_id: null,
        otdr_distance_en_km: null,
        otdr_distance_sn_km: null,
        path_segment_order: null,
        remark: null,
        route_loss_db: null,
        sn_dom: null,
        sn_power_dbm: null,
        // created_at and updated_at are best handled by the database itself
      };
      return connection;
    });

    try {
      console.log(`Creating ${newConnections.length} new connections`);
      await createConnections(newConnections);
    } catch (error) {
      console.error('Failed to create connections:', error);
      throw error;
    }
  }, [cable, cableId, createConnections, supabase]);

  // ensureConnectionsExist (unchanged)
  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingOfcConnections) {
      console.log('Still loading data, skipping connection creation');
      return;
    }

    try {
      await createMissingConnections();
    } catch (error) {
      console.error('Error ensuring connections exist:', error);
      throw error;
    }
  }, [isLoadingCable, isLoadingOfcConnections, createMissingConnections]);

  return {
    // EXISTING API (unchanged)
    cable: cable?.[0],
    existingConnections, // Now optionally client-sorted, but maintains same structure
    isLoading: isLoadingCable || isLoadingOfcConnections,
    ensureConnectionsExist,
    createMissingConnections,
    totalCount,
    activeCount,
    inactiveCount,

    // NEW: Optional sorting enhancements (only available if enableClientSorting is true)
    ...(enableClientSorting && {
      sortConfig,
      handleSortColumn,
      resetSort,
      isSorted,
      getSortDirection,
      isClientSorting: true,
    }),
  };
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useOfcConnection copy.ts -->
```typescript
import { useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useTableQuery, useTableWithRelations } from "./database/core-queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePagedOfcConnectionsComplete } from "./database";

type OfcConnection = Database["public"]["Tables"]["ofc_connections"]["Insert"] & {
  id?: string;
};

interface UseOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  // pagination and sorting options
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  // optional server-side search query
  search?: string;
}

export const useOfcConnection = ({ supabase, cableId, limit = 10, offset = 0, orderBy = "fiber_no_sn", orderDir = "asc", search }: UseOfcConnectionProps) => {
  const queryClient = useQueryClient();

  // Get cable details
  type OfcCableWithJoins = Database["public"]["Tables"]["ofc_cables"]["Row"] & {
    maintenance_area: { id: string; name: string } | null;
    ofc_type: { id: string; name: string } | null;
  };

  const { data: cable, isLoading: isLoadingCable } = useTableWithRelations<
    "ofc_cables",
    OfcCableWithJoins[]
  >(supabase, "ofc_cables", [
    "maintenance_area:maintenance_terminal_id(id, name)",
    "ofc_type:ofc_type_id(id, name)",
  ], {
    filters: { id: cableId },
  });

  // Get existing connections for this cable with pagination
  // Also retrieve Total Count of Connections, activeCount, inactiveCount from the view
  const { data: existingConnections = [], isLoading: isLoadingOfcConnections, refetch: refetchOfcConnections } = usePagedOfcConnectionsComplete(supabase, {
    filters: { ofc_id: cableId, ...(search ? { search } : {}) },
    limit,
    offset,
    orderBy,
    orderDir,
  });

  const totalCount = existingConnections?.[0]?.total_count || 0;
  const activeCount = existingConnections?.[0]?.active_count || 0;
  const inactiveCount = existingConnections?.[0]?.inactive_count || 0;

  // Mutation for creating new connections
  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: OfcConnection[]) => {
      const { data, error } = await supabase.from("ofc_connections").insert(newConnections);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections query after successful insertion
      queryClient.invalidateQueries({ queryKey: ["ofc_connections"] });
      refetchOfcConnections();
    },
  });

  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable || !cable[0]) return;

    // Get fresh connection count to avoid stale data
    const { data: currentConnections, error } = await supabase.from("ofc_connections").select("id").eq("ofc_id", cableId);

    if (error) {
      console.error("Failed to fetch current connections:", error);
      throw error;
    }

    const currentConnectionCount = currentConnections?.length || 0;
    const cableCapacity = cable[0].capacity as number;
    const missingCount = cableCapacity - currentConnectionCount;

    console.log(`Cable capacity: ${cableCapacity}, Current connections: ${currentConnectionCount}, Missing: ${missingCount}`);

    if (missingCount <= 0) {
      console.log("No missing connections to create");
      return;
    }

    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: OfcConnection = {
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        connection_type: "straight", // Or a default value
        connection_category: "OFC_JOINT_TYPES", // Or a default value
        status: true,
        // --- All optional fields are explicitly set to null for clarity ---
        system_id: null, // <-- The only missing field, now added
        destination_port: null,
        source_port: null,
        en_dom: null,
        en_power_dbm: null,
        fiber_no_en: null,
        logical_path_id: null,
        otdr_distance_en_km: null,
        otdr_distance_sn_km: null,
        path_segment_order: null,
        remark: null,
        route_loss_db: null,
        sn_dom: null,
        sn_power_dbm: null,
        // created_at and updated_at are best handled by the database itself
      };
      return connection;
    });

    try {
      console.log(`Creating ${newConnections.length} new connections`);
      await createConnections(newConnections);
    } catch (error) {
      console.error("Failed to create connections:", error);
      throw error;
    }
  }, [cable, cableId, createConnections, supabase]);

  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingOfcConnections) {
      console.log("Still loading data, skipping connection creation");
      return;
    }

    try {
      await createMissingConnections();
    } catch (error) {
      console.error("Error ensuring connections exist:", error);
      throw error;
    }
  }, [isLoadingCable, isLoadingOfcConnections, createMissingConnections]);

  return {
    cable: cable?.[0],
    existingConnections,
    isLoading: isLoadingCable || isLoadingOfcConnections,
    ensureConnectionsExist,
    createMissingConnections,
    totalCount,
    activeCount,
    inactiveCount,
  };
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/bulk-queries.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { TableName, TableRow, TableInsert, TableUpdate, Filters, OrderBy, PerformanceOptions } from "./queries-type-helpers";
import { applyFilters } from "./utility-functions";

// Enhanced bulk operations hook with filter support
export function useTableBulkOperations<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, batchSize = 1000) {
  const queryClient = useQueryClient();

  const bulkInsert = useMutation({
    mutationFn: async (data: TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;
        const { data: batchResult, error } = await supabase.from(tableName).insert(batch).select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Enhanced bulk update with filter support
  const bulkUpdate = useMutation({
    mutationFn: async (params: {
      updates: { id: string; data: TableUpdate<T> }[];
      filters?: Filters; // Optional filters to apply to ALL updates
    }): Promise<TableRow<T>[]> => {
      const { updates, filters } = params;
      const results: TableRow<T>[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        const batchPromises = batch.map(async ({ id, data }) => {
          let query = supabase
            .from(tableName)
            .update(data as any)
            .eq("id" as any, id);

          // Apply additional filters if provided
          if (filters) {
            query = applyFilters(query, filters);
          }

          const { data: result, error } = await query.select();
          if (error) throw error;
          return result as TableRow<T>[];
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.flat());
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Enhanced bulk delete with filter support
  const bulkDelete = useMutation({
    mutationFn: async (params: {
      ids?: string[];
      filters?: Filters; // Optional: delete by filters instead of/in addition to IDs
      deleteAll?: boolean; // Safety flag for deleting all records
    }): Promise<void> => {
      const { ids, filters, deleteAll = false } = params;

      // Safety check: require either IDs, filters, or explicit deleteAll flag
      if (!ids && !filters && !deleteAll) {
        throw new Error("Must provide either ids, filters, or set deleteAll to true");
      }

      if (ids && ids.length > 0) {
        // Delete by IDs (existing behavior, but with optional additional filters)
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          let query = supabase
            .from(tableName)
            .delete()
            .in("id" as any, batch);

          // Apply additional filters if provided
          if (filters) {
            query = applyFilters(query, filters);
          }

          const { error } = await query;
          if (error) throw error;
        }
      } else if (filters || deleteAll) {
        // Delete by filters only
        let query = supabase.from(tableName).delete();

        if (filters) {
          query = applyFilters(query, filters);
        }

        const { error } = await query;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  const bulkUpsert = useMutation({
    mutationFn: async (data: TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;
        const { data: batchResult, error } = await supabase.from(tableName).upsert(batch).select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Bulk insert with conditional logic based on existing data
  const bulkInsertByFilters = useMutation({
    mutationFn: async (params: {
      data: TableInsert<T>[];
      conflictResolution?: "skip" | "update" | "error"; // How to handle conflicts
      checkFilters?: Filters; // Check if records matching these filters exist
      onConflict?: string; // Column(s) to check for conflicts (e.g., 'email' or 'email,username')
    }): Promise<TableRow<T>[]> => {
      const { data, conflictResolution = "error", checkFilters, onConflict } = params;

      if (checkFilters) {
        // Check for existing records that match the filters
        let checkQuery = supabase.from(tableName).select("id");
        checkQuery = applyFilters(checkQuery, checkFilters);

        const { data: existingRecords, error: checkError } = await checkQuery;
        if (checkError) throw checkError;

        if (existingRecords && existingRecords.length > 0) {
          switch (conflictResolution) {
            case "skip":
              return []; // Skip insertion if records exist
            case "error":
              throw new Error(`Records matching filters already exist: ${existingRecords.length} found`);
            case "update":
              // Convert to upsert operation
              const { data: upsertResult, error: upsertError } = await supabase
                .from(tableName)
                .upsert(data as any, { onConflict })
                .select();
              if (upsertError) throw upsertError;
              return upsertResult as TableRow<T>[];
          }
        }
      }

      // Proceed with normal insertion
      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;

        let insertQuery = supabase.from(tableName).insert(batch);

        // Handle conflicts at database level if onConflict is specified
        if (conflictResolution === "skip" && onConflict) {
          insertQuery = supabase.from(tableName).upsert(batch, {
            onConflict,
            ignoreDuplicates: true,
          });
        } else if (conflictResolution === "update" && onConflict) {
          insertQuery = supabase.from(tableName).upsert(batch, { onConflict });
        }

        const { data: batchResult, error } = await insertQuery.select();
        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Bulk update by filters (update multiple records matching criteria)
  const bulkUpdateByFilters = useMutation({
    mutationFn: async (params: {
      data: TableUpdate<T>;
      filters: Filters;
      limit?: number; // Optional safety limit
    }): Promise<TableRow<T>[]> => {
      const { data, filters, limit } = params;

      let query = supabase.from(tableName).update(data as any);

      // Apply filters
      query = applyFilters(query, filters);

      // Apply limit if provided (for safety)
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error } = await query.select();
      if (error) throw error;
      return result as TableRow<T>[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Bulk upsert with filter-based conflict detection
  const bulkUpsertByFilters = useMutation({
    mutationFn: async (params: {
      data: TableInsert<T>[];
      onConflict?: string; // Column(s) for conflict detection
      checkFilters?: Filters; // Pre-check existing records
      updateColumns?: string[]; // Which columns to update on conflict (if not specified, updates all)
    }): Promise<TableRow<T>[]> => {
      const { data, onConflict, checkFilters, updateColumns } = params;

      // Optional: Check existing records first
      if (checkFilters) {
        try {
          // Create a new query builder
          let checkQuery = supabase.from(tableName).select("*", { count: "exact" });

          // Apply the filters
          checkQuery = applyFilters(checkQuery, checkFilters);

          // Execute the query
          const { data: existingRecords, error: checkError, count } = await checkQuery;

          if (checkError) {
            throw checkError;
          }

          console.log(`Found ${count || 0} existing records matching filters`);
        } catch (error) {
          throw error;
        }
      }

      const results: TableRow<T>[] = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize) as any;

        const upsertOptions: any = {};
        if (onConflict) {
          upsertOptions.onConflict = onConflict;
        }
        if (updateColumns) {
          upsertOptions.columns = updateColumns;
        }

        const { data: batchResult, error } = await supabase.from(tableName).upsert(batch, upsertOptions).select();

        if (error) throw error;
        results.push(...(batchResult as TableRow<T>[]));
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // New: Conditional bulk operations (perform operation only if conditions are met)
  const conditionalBulkUpdate = useMutation({
    mutationFn: async (params: {
      updates: Array<{
        id: string;
        data: TableUpdate<T>;
        conditions?: Filters; // Conditions that must be met for this specific update
      }>;
      globalFilters?: Filters; // Filters applied to all updates
    }): Promise<TableRow<T>[]> => {
      const { updates, globalFilters } = params;
      const results: TableRow<T>[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        const batchPromises = batch.map(async ({ id, data, conditions }) => {
          let query = supabase
            .from(tableName)
            .update(data as any)
            .eq("id" as any, id);

          // Apply global filters
          if (globalFilters) {
            query = applyFilters(query, globalFilters);
          }

          // Apply individual conditions
          if (conditions) {
            query = applyFilters(query, conditions);
          }

          const { data: result, error } = await query.select();
          if (error) throw error;
          return result as TableRow<T>[];
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.flat());
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  return {
    bulkInsert,
    bulkUpdate,
    bulkDelete,
    bulkUpsert,
    bulkUpdateByFilters,
    bulkInsertByFilters,
    bulkUpsertByFilters,
    conditionalBulkUpdate,
  };
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/basic-mutation-hooks.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { TableName, TableRow, TableInsert, TableUpdate, OptimisticContext, UseTableMutationOptions } from "./queries-type-helpers";

// Generic toggle status hook
export function useToggleStatus<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<TableRow<T>, { id: string; status: boolean; nameField?: keyof TableRow<T> }, OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = true, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>, Error, { id: string; status: boolean; nameField?: keyof TableRow<T> }, OptimisticContext>({
    mutationFn: async ({ id, status }): Promise<TableRow<T>> => {
      const { data, error } = await supabase
        .from(tableName)
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq("id" as any, id)
        .select()
        .single();
      if (error) throw error;
      return data as TableRow<T>;
    },
    onMutate: optimisticUpdate
      ? async ({ id, status }) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });
          const previousData = queryClient.getQueriesData({ queryKey: ["table", tableName] });
          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            return old.map((item) => ("id" in item && (item as { id: unknown }).id === id ? { ...item, status, updated_at: new Date().toISOString() } : item)) as TableRow<T>[];
          });
          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          context?.previousData?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Optimized insert mutation with batching
export function useTableInsert<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<TableRow<T>[], TableInsert<T> | TableInsert<T>[], OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = false, batchSize = 1000, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>[], Error, TableInsert<T> | TableInsert<T>[], OptimisticContext>({
    mutationFn: async (data: TableInsert<T> | TableInsert<T>[]): Promise<TableRow<T>[]> => {
      const payload = (Array.isArray(data) ? data : [data]) as any;

      // Batch large inserts for better performance
      if (payload.length > batchSize) {
        const batches = [];
        for (let i = 0; i < payload.length; i += batchSize) {
          batches.push(payload.slice(i, i + batchSize));
        }

        const results = await Promise.all(
          batches.map(async (batch) => {
            const { data: result, error } = await supabase.from(tableName).insert(batch).select();
            if (error) throw error;
            return result as TableRow<T>[];
          })
        );

        return results.flat();
      }

      const { data: result, error } = await supabase.from(tableName).insert(payload).select();

      if (error) throw error;
      return result as TableRow<T>[];
    },
    onMutate: optimisticUpdate
      ? async (newData) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });

          const previousData = queryClient.getQueriesData({
            queryKey: ["table", tableName],
          });

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            const newItems = Array.isArray(newData) ? newData : [newData];
            return [
              ...old,
              ...newItems.map((item, index) => ({
                ...item,
                id: `temp-${Date.now()}-${index}`,
              })),
            ] as TableRow<T>[];
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, newData, context) => {
          if (context?.previousData) {
            context.previousData.forEach(([queryKey, data]) => {
              queryClient.setQueryData(queryKey, data);
            });
          }
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Enhanced update mutation with optimizations
export function useTableUpdate<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<TableRow<T>[], { id: string; data: TableUpdate<T> }, OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = false, ...mutationOptions } = options || {};

  return useMutation<TableRow<T>[], Error, { id: string; data: TableUpdate<T> }, OptimisticContext>({
    mutationFn: async ({ id, data }: { id: string; data: TableUpdate<T> }): Promise<TableRow<T>[]> => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data as any)
        .eq("id" as any, id)
        .select();

      if (error) throw error;
      return result as TableRow<T>[];
    },
    onMutate: optimisticUpdate
      ? async ({ id, data: newData }) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });

          const previousData = queryClient.getQueriesData({
            queryKey: ["table", tableName],
          });

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            return old.map((item) => ("id" in item && (item as { id: unknown }).id === id ? { ...item, ...newData } : item)) as TableRow<T>[];
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          if (context?.previousData) {
            context.previousData.forEach(([queryKey, data]) => {
              queryClient.setQueryData(queryKey, data);
            });
          }
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Enhanced delete mutation
export function useTableDelete<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableMutationOptions<void, string | string[], OptimisticContext>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, optimisticUpdate = false, batchSize = 1000, ...mutationOptions } = options || {};

  return useMutation<void, Error, string | string[], OptimisticContext>({
    mutationFn: async (id: string | string[]): Promise<void> => {
      const ids = Array.isArray(id) ? id : [id];

      // Batch large deletes for better performance
      if (ids.length > batchSize) {
        const batches = [];
        for (let i = 0; i < ids.length; i += batchSize) {
          batches.push(ids.slice(i, i + batchSize));
        }

        await Promise.all(
          batches.map(async (batch) => {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .in("id" as any, batch);
            if (error) throw error;
          })
        );
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .in("id" as any, ids);

      if (error) throw error;
    },
    onMutate: optimisticUpdate
      ? async (id) => {
          await queryClient.cancelQueries({ queryKey: ["table", tableName] });

          const previousData = queryClient.getQueriesData({
            queryKey: ["table", tableName],
          });
          const ids = Array.isArray(id) ? id : [id];

          queryClient.setQueriesData({ queryKey: ["table", tableName] }, (old: TableRow<T>[] | undefined) => {
            if (!old) return [];
            return old.filter((item) => !("id" in item) || !ids.includes((item as { id: string }).id)) as TableRow<T>[];
          });

          return { previousData };
        }
      : undefined,
    onError: optimisticUpdate
      ? (err, variables, context) => {
          if (context?.previousData) {
            context.previousData.forEach(([queryKey, data]) => {
              queryClient.setQueryData(queryKey, data);
            });
          }
        }
      : undefined,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["table", tableName] });
        queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/file-queries.ts -->
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase-types";

type FileRecord = Database["public"]["Tables"]["files"]["Row"];
type FileInsert = Database["public"]["Tables"]["files"]["Insert"];
type FileUpdate = Database["public"]["Tables"]["files"]["Update"];

export function useFiles(folderId?: string | null) {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ["files", folderId],
    queryFn: async () => {
      let query = supabase
        .from("files")
        .select("*");
      
      if (folderId) {
        query = query.eq("folder_id", folderId);
      }
      
      const { data, error } = await query.order("uploaded_at", { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: true,
  });
}

export function useUploadFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData: FileInsert) => {
      const { data, error } = await supabase
        .from("files")
        .insert(fileData)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", variables.folder_id] 
      });
    },
  });
}

export function useDeleteFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      folderId,
    }: {
      id: string;
      folderId?: string | null;
    }) => {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", variables.folderId] 
      });
    },
  });
}

export function useUpdateFile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: FileUpdate;
    }) => {
      const { data, error } = await supabase
        .from("files")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["files", data.folder_id] 
      });
    },
  });
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/utility-functions.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryKey } from "@tanstack/react-query";
import { AggregationOptions, DeduplicationOptions, FilterOperator, Filters, OrderBy, PerformanceOptions } from "./queries-type-helpers";
import { Json } from "@/types/supabase-types";

// --- UTILITY FUNCTIONS ---
export const createQueryKey = (
  tableName: string,
  filters?: Filters,
  columns?: string,
  orderBy?: OrderBy[],
  deduplication?: DeduplicationOptions,
  aggregation?: AggregationOptions,
  limit?: number,
  offset?: number
): QueryKey => {
  const key: unknown[] = ["table", tableName];
  const params: Record<string, unknown> = { filters, columns, orderBy, deduplication, aggregation, limit, offset };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createRpcQueryKey = (functionName: string, args?: Record<string, unknown>, performance?: PerformanceOptions): QueryKey => {
  const key: unknown[] = ["rpc", functionName];
  const params = { args, performance };
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
  if (Object.keys(cleanParams).length > 0) key.push(cleanParams);
  return key;
};

export const createUniqueValuesKey = (tableName: string, column: string, filters?: Filters, orderBy?: OrderBy[]): QueryKey => ["unique", tableName, column, { filters, orderBy }];

export function applyFilters(query: any, filters: Filters): any {
  let modifiedQuery = query;
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // Support raw OR conditions: pass a prebuilt PostgREST or() string
    if (key === "$or") {
      if (typeof value === "string" && typeof modifiedQuery.or === "function") {
        modifiedQuery = modifiedQuery.or(value);
      } else if (
        typeof value === "object" && !Array.isArray(value) && "operator" in value && (value as any).operator === "or"
      ) {
        const v = (value as any).value;
        if (typeof v === "string" && typeof modifiedQuery.or === "function") {
          modifiedQuery = modifiedQuery.or(v);
        } else {
          console.warn("$or filter value must be a string representing PostgREST conditions");
        }
      } else {
        console.warn("Unsupported $or filter format; expected string or { operator: 'or', value: string }");
      }
      return;
    }

    if (typeof value === "object" && !Array.isArray(value) && "operator" in value) {
      const { operator, value: filterValue } = value as { operator: FilterOperator; value: unknown };
      if (operator === "or" && typeof filterValue === "string" && typeof modifiedQuery.or === "function") {
        modifiedQuery = modifiedQuery.or(filterValue as string);
      } else if (operator in modifiedQuery && typeof (modifiedQuery as any)[operator] === 'function') {
        modifiedQuery = modifiedQuery[operator](key, filterValue);
      } else {
        console.warn(`Unsupported or dynamic operator used: ${operator}`);
      }
    } else if (Array.isArray(value)) {
      modifiedQuery = modifiedQuery.in(key, value);
    } else {
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  });
  return modifiedQuery;
}

export function applyOrdering(query: any, orderBy: OrderBy[]): any {
  let modifiedQuery = query;
  orderBy.forEach(({ column, ascending = true, nullsFirst, foreignTable }) => {
    const orderColumn = foreignTable ? `${foreignTable}.${column}` : column;
    const options: { ascending: boolean; nullsFirst?: boolean } = { ascending };
    if (nullsFirst !== undefined) options.nullsFirst = nullsFirst;
    modifiedQuery = modifiedQuery.order(orderColumn, options);
  });
  return modifiedQuery;
}

export function buildDeduplicationQuery(tableName: string, deduplication: DeduplicationOptions, filters?: Filters, orderBy?: OrderBy[]): string {
  const { columns, orderBy: dedupOrderBy } = deduplication;
  const partitionBy = columns.join(', ');
  const rowNumberOrder = dedupOrderBy?.length
    ? dedupOrderBy.map(o => `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}`).join(', ')
    : 'id ASC';

  let finalOrderClause = '';
  if (orderBy && orderBy.length > 0) {
    const orderParts = orderBy.map(o =>
      `${o.column} ${o.ascending !== false ? 'ASC' : 'DESC'}${o.nullsFirst !== undefined ? (o.nullsFirst ? ' NULLS FIRST' : ' NULLS LAST') : ''}`
    );
    finalOrderClause = `ORDER BY ${orderParts.join(', ')}`;
  }

  let whereClause = '';
  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null) // FIX: Ensure value is not null
      .map(([key, value]) => {
        // FIX: Added check for null on value before accessing properties
        if (value && typeof value === 'object' && !Array.isArray(value) && 'operator' in value) {
          const filterValue = typeof value.value === 'string' ? `'${value.value.toString().replace(/'/g, "''")}'` : value.value;
          return `${key} = ${filterValue}`;
        }
        if (Array.isArray(value)) {
          const arrayValues = value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(',');
          return `${key} IN (${arrayValues})`;
        }
        const filterValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
        return `${key} = ${filterValue}`;
      });

    if (conditions.length > 0) whereClause = `WHERE ${conditions.join(' AND ')}`;
  }

  return `
    WITH deduplicated AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY ${partitionBy} ORDER BY ${rowNumberOrder}) as rn
      FROM ${tableName}
      ${whereClause}
    )
    SELECT * FROM deduplicated WHERE rn = 1 ${finalOrderClause}
  `;
}

/**
 * Converts a rich "Filters" object (used by the PostgREST query builder)
 * into a simple key-value JSON object suitable for RPC functions.
 * It strips out complex operators and preserves simple values.
 *
 * @param filters The rich Filters object.
 * @returns A Json-compatible object.
 */
export function convertRichFiltersToSimpleJson(filters: Filters): Json {
  const simpleFilters: { [key: string]: Json | undefined } = {};

  for (const key in filters) {
    // Skip the client-side only '$or' operator
    if (key === '$or') {
      continue;
    }

    const filterValue = filters[key];

    // Check if the value is a simple primitive (string, number, boolean, or null)
    if (
      typeof filterValue === 'string' ||
      typeof filterValue === 'number' ||
      typeof filterValue === 'boolean' ||
      filterValue === null
    ) {
      simpleFilters[key] = filterValue;
    }
    // You can also handle simple arrays if your RPCs support the 'IN' operator
    else if (Array.isArray(filterValue)) {
        simpleFilters[key] = filterValue;
    }
    // We explicitly IGNORE complex objects like { operator: 'neq', value: '...' }
    // because the RPC function doesn't know how to handle them.
  }

  return simpleFilters;
}
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/advanced-bulk-queries.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { TableName, TableRow, TableUpdate, Filters, OrderBy, PerformanceOptions } from "./queries-type-helpers";
import { applyFilters, applyOrdering } from "./utility-functions";

// Enhanced bulk operations with more advanced filtering and performance features
export function useAdvancedBulkOperations<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: {
    batchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    onProgress?: (completed: number, total: number) => void;
  }
) {
  const queryClient = useQueryClient();
  const { maxRetries = 3, retryDelay = 1000, onProgress } = options || {};

  // Helper function for retrying operations
  const withRetry = async <TResult>(operation: () => Promise<TResult>, retries = maxRetries): Promise<TResult> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return withRetry(operation, retries - 1);
      }
      throw error;
    }
  };

  // Advanced bulk update with complex filtering and progress tracking
  const advancedBulkUpdate = useMutation({
    mutationFn: async (params: {
      criteria: {
        filters: Filters;
        data: TableUpdate<T>;
        orderBy?: OrderBy[];
        limit?: number;
      }[];
      performanceOptions?: PerformanceOptions;
    }): Promise<TableRow<T>[]> => {
      const { criteria, performanceOptions } = params;
      const allResults: TableRow<T>[] = [];
      let completed = 0;
      const total = criteria.length;

      for (const { filters, data, orderBy, limit } of criteria) {
        await withRetry(async () => {
          let query = supabase.from(tableName).update(data as any);

          // Apply filters
          query = applyFilters(query, filters);

          // Apply ordering if specified
          if (orderBy && orderBy.length > 0) {
            query = applyOrdering(query, orderBy);
          }

          // Apply limit if specified
          if (limit) {
            query = query.limit(limit);
          }

          // Apply performance options
          if (performanceOptions?.timeout) {
            query = query.abortSignal(AbortSignal.timeout(performanceOptions.timeout));
          }

          const { data: result, error } = await query.select();
          if (error) throw error;

          allResults.push(...(result as TableRow<T>[]));
          completed++;
          onProgress?.(completed, total);
        });
      }

      return allResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Advanced bulk delete with complex criteria
  const advancedBulkDelete = useMutation({
    mutationFn: async (params: {
      criteria: Array<{
        filters?: Filters;
        ids?: string[];
        orderBy?: OrderBy[];
        limit?: number;
      }>;
      safetyLimit?: number; // Global safety limit
      performanceOptions?: PerformanceOptions;
    }): Promise<{ deletedCount: number; details: Array<{ criteriaIndex: number; deletedCount: number }> }> => {
      const { criteria, safetyLimit, performanceOptions } = params;
      let totalDeleted = 0;
      const details: Array<{ criteriaIndex: number; deletedCount: number }> = [];
      let completed = 0;
      const total = criteria.length;

      for (let i = 0; i < criteria.length; i++) {
        const { filters, ids, orderBy, limit } = criteria[i];

        await withRetry(async () => {
          let query = supabase.from(tableName).delete();

          // Apply ID filters if provided
          if (ids && ids.length > 0) {
            query = query.in("id" as any, ids);
          }

          // Apply other filters
          if (filters) {
            query = applyFilters(query, filters);
          }

          // Apply ordering (useful for limited deletes)
          if (orderBy && orderBy.length > 0) {
            query = applyOrdering(query, orderBy);
          }

          // Apply limit (either specified or safety limit)
          const effectiveLimit = Math.min(limit || Number.MAX_SAFE_INTEGER, safetyLimit || Number.MAX_SAFE_INTEGER);

          if (effectiveLimit < Number.MAX_SAFE_INTEGER) {
            query = query.limit(effectiveLimit);
          }

          // Apply performance options
          if (performanceOptions?.timeout) {
            query = query.abortSignal(AbortSignal.timeout(performanceOptions.timeout));
          }

          // First, count the records that will be deleted
          let countQuery = supabase.from(tableName).select("*", { count: "exact", head: true });

          if (ids && ids.length > 0) {
            countQuery = countQuery.in("id" as any, ids);
          }
          if (filters) {
            countQuery = applyFilters(countQuery, filters);
          }
          if (orderBy && orderBy.length > 0) {
            countQuery = applyOrdering(countQuery, orderBy);
          }
          if (effectiveLimit < Number.MAX_SAFE_INTEGER) {
            countQuery = countQuery.limit(effectiveLimit);
          }

          const { count: recordCount, error: countError } = await countQuery;
          if (countError) throw countError;

          // Now perform the actual delete
          const { error } = await query;
          if (error) throw error;

          const deletedInThisCriteria = recordCount || 0;
          totalDeleted += deletedInThisCriteria;
          details.push({ criteriaIndex: i, deletedCount: deletedInThisCriteria });

          completed++;
          onProgress?.(completed, total);
        });
      }

      return { deletedCount: totalDeleted, details };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  // Batch operation with transaction-like behavior (all or nothing)
  const transactionalBulkOperation = useMutation({
    mutationFn: async (params: {
      operations: Array<{
        type: "insert" | "update" | "delete";
        data?: any;
        filters?: Filters;
        ids?: string[];
      }>;
    }): Promise<{ success: boolean; results: any[]; errors?: Error[] }> => {
      const { operations } = params;
      const results: any[] = [];
      const errors: Error[] = [];

      // In a real implementation, you might want to use database transactions
      // For now, we'll simulate transaction-like behavior with rollback on error

      try {
        for (const operation of operations) {
          switch (operation.type) {
            case "insert":
              if (!operation.data) throw new Error("Insert operation requires data");
              const { data: insertData, error: insertError } = await supabase.from(tableName).insert(operation.data).select();
              if (insertError) throw insertError;
              results.push(insertData);
              break;

            case "update":
              if (!operation.data) throw new Error("Update operation requires data");
              let updateQuery = supabase.from(tableName).update(operation.data);

              if (operation.ids) {
                updateQuery = updateQuery.in("id" as any, operation.ids);
              }
              if (operation.filters) {
                updateQuery = applyFilters(updateQuery, operation.filters);
              }

              const { data: updateData, error: updateError } = await updateQuery.select();
              if (updateError) throw updateError;
              results.push(updateData);
              break;

            case "delete":
              let deleteQuery = supabase.from(tableName).delete();

              if (operation.ids) {
                deleteQuery = deleteQuery.in("id" as any, operation.ids);
              }
              if (operation.filters) {
                deleteQuery = applyFilters(deleteQuery, operation.filters);
              }

              const { error: deleteError } = await deleteQuery;
              if (deleteError) throw deleteError;
              results.push({ deleted: true });
              break;
          }
        }

        return { success: true, results };
      } catch (error) {
        errors.push(error as Error);
        // In a real database transaction, you would rollback here
        return { success: false, results: [], errors };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
    },
  });

  return {
    advancedBulkUpdate,
    advancedBulkDelete,
    transactionalBulkOperation,
  };
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/core-queries.ts -->
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/supabase-types";
import { TableOrViewName, TableName, Row, RowWithCount, DeduplicationOptions, InfiniteQueryPage, UseTableQueryOptions, UseTableInfiniteQueryOptions, UseTableRecordOptions, UseUniqueValuesOptions } from "./queries-type-helpers";
import { applyFilters, applyOrdering, buildDeduplicationQuery, createQueryKey, createUniqueValuesKey } from "./utility-functions";

// Generic table query hook with enhanced features
export function useTableQuery<T extends TableOrViewName, TData = RowWithCount<Row<T>>[]>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableQueryOptions<T, TData>) {
  const { columns = "*", filters, orderBy, limit, offset, deduplication, aggregation, performance, includeCount = false, ...queryOptions } = options || {};

  type QueryFnData = RowWithCount<Row<T>>[];

  return useQuery({
    queryKey: createQueryKey(tableName, filters, columns, orderBy, deduplication, aggregation, limit, offset),
    queryFn: async (): Promise<QueryFnData> => {
      if (deduplication) {
        const sql = buildDeduplicationQuery(tableName as string, deduplication, filters, orderBy);
        const { data: rpcData, error: rpcError } = await supabase.rpc("execute_sql", { sql_query: sql });
        if (rpcError) throw rpcError;
        if (rpcData && (rpcData as any).error) throw new Error(`Database RPC Error: ${(rpcData as any).error}`);
        return (rpcData as any)?.result || [];
      }

      if (aggregation) {
        const { data, error } = await supabase.rpc("aggregate_query", {
          table_name: tableName,
          aggregation_options: aggregation as unknown as Json,
          filters: (filters || {}) as unknown as Json,
          order_by: (orderBy || []) as unknown as Json,
        });
        if (error) throw error;
        return (data as any)?.result || [];
      }

      // When includeCount is requested, use Supabase's metadata count to support relation selects.
      // We then project the count back onto each row as `total_count` for backward compatibility.
      let query = includeCount
        ? supabase.from(tableName as any).select(columns as string, { count: "exact" })
        : supabase.from(tableName as any).select(columns as string);

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);
      if (limit !== undefined) query = query.limit(limit);
      if (offset !== undefined) query = query.range(offset, offset + (limit || 1000) - 1);
      if (performance?.timeout) query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = await query as any;
      if (error) throw error;
      const rows = (data as unknown as Row<T>[]) || [];
      if (!includeCount) return rows as unknown as QueryFnData;
      const total = typeof count === "number" ? count : 0;
      // Attach total_count to each row to emulate window-count behavior
      const withCount = rows.map((r) => ({ ...(r as any), total_count: total }));
      return withCount as unknown as QueryFnData;
    },
    ...queryOptions,
  });
}

// Infinite scroll query hook for large datasets
export function useTableInfiniteQuery<T extends TableOrViewName, TData = InfiniteData<InfiniteQueryPage<T>>>(supabase: SupabaseClient<Database>, tableName: T, options?: UseTableInfiniteQueryOptions<T, TData>) {
  const { columns = "*", filters, orderBy, pageSize = 20, performance, ...queryOptions } = options || {};

  return useInfiniteQuery({
    queryKey: createQueryKey(tableName, filters, columns, orderBy, undefined, undefined, pageSize),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase.from(tableName as any).select(columns, { count: "exact" });

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);

      const startIdx = pageParam * pageSize;
      query = query.range(startIdx, startIdx + pageSize - 1);

      if (performance?.timeout) query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = await query;
      if (error) throw error;

      const results = (data as unknown as Row<T>[]) || [];

      return {
        data: results,
        nextCursor: results.length === pageSize ? pageParam + 1 : undefined,
        count: count ?? 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    ...queryOptions,
  });
}

// Generic single record query hook (optimized)
export function useTableRecord<T extends TableOrViewName, TData = Row<T> | null>(supabase: SupabaseClient<Database>, tableName: T, id: string | null, options?: UseTableRecordOptions<T, TData>) {
  const { columns = "*", performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createQueryKey(tableName, { id: id as any }, columns),
    queryFn: async (): Promise<Row<T> | null> => {
      if (!id) return null;

      let query = supabase
        .from(tableName as any)
        .select(columns)
        .eq("id", id);

      if (performance?.timeout) query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error } = await query.maybeSingle();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found, which is a valid null result
        throw error;
      }
      return (data as unknown as Row<T>) || null;
    },
    enabled: !!id && (queryOptions?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Get unique values for a specific column
export function useUniqueValues<T extends TableOrViewName, TData = unknown[]>(supabase: SupabaseClient<Database>, tableName: T, column: string, options?: UseUniqueValuesOptions<T, TData>) {
  const { filters, orderBy, limit, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createUniqueValuesKey(tableName, column, filters, orderBy),
    queryFn: async (): Promise<unknown[]> => {
      const { data, error } = await supabase.rpc("get_unique_values", {
        table_name: tableName,
        column_name: column,
        filters: (filters || {}) as unknown as Json,
        order_by: (orderBy || []) as unknown as Json,
        limit_count: limit,
      });
      if (error) {
        console.error("RPC unique values failed, falling back to direct query", error);
        // Fallback implementation
        let fallbackQuery = supabase.from(tableName as any).select(column);
        if (filters) fallbackQuery = applyFilters(fallbackQuery, filters);
        if (orderBy?.length) fallbackQuery = applyOrdering(fallbackQuery, orderBy);
        if (limit) fallbackQuery = fallbackQuery.limit(limit);

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return [...new Set((fallbackData as any[])?.map((item) => item[column]) || [])];
      }
      return (data as any)?.map((item: any) => item.value) || [];
    },
    staleTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Deduplicated rows hook
export function useDeduplicated<T extends TableName>(supabase: SupabaseClient<Database>, tableName: T, deduplicationOptions: DeduplicationOptions, options?: Omit<UseTableQueryOptions<T>, "deduplication">) {
  return useTableQuery(supabase, tableName, {
    ...options,
    deduplication: deduplicationOptions,
  });
}

// Relationship query hook with optimizations
export function useTableWithRelations<T extends TableName, TData = RowWithCount<Row<T>>[]>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  relations: string[],
  options?: UseTableQueryOptions<T, TData>
) {
  const columnsString = relations.length > 0 ? `*, ${relations.join(", ")}` : "*";

  return useTableQuery<T, TData>(supabase, tableName, {
    ...options,
    columns: columnsString,
  });
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/index.ts -->
```typescript
// hooks/database/index.ts - Main export file
export * from './queries-type-helpers'
export * from './utility-functions'
export * from './core-queries'
export * from './basic-mutation-hooks'
export * from './bulk-queries'
export * from './advanced-bulk-queries'

// Additional specialized hooks for complex operations
export * from './rpc-queries'
// Performance and Cache hooks
export * from './cache-performance'









```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/rpc-queries.ts -->
```typescript
import { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { RpcFunctionName, RpcFunctionArgs, RpcFunctionReturns, UseRpcQueryOptions, UseTableMutationOptions, PagedSystemsCompleteResult, UsePagedSystemsCompleteOptions, UsePagedNodesCompleteOptions, PagedNodesCompleteResult, PagedOfcConnectionsCompleteResult, UsePagedOfcConnectionsCompleteOptions, UsePagedSystemConnectionsCompleteOptions, PagedSystemConnectionsCompleteResult, UsePagedLookupTypesWithCountOptions, PagedLookupTypesWithCountResult, UsePagedMaintenanceAreasWithCountOptions, PagedMaintenanceAreasWithCountResult, UsePagedEmployeeDesignationsWithCountOptions, PagedEmployeeDesignationsWithCountResult, UsePagedEmployeesWithCountOptions, PagedEmployeesWithCountResult, UsePagedRingsWithCountOptions, PagedRingsWithCountResult } from "./queries-type-helpers";
import { createRpcQueryKey } from "./utility-functions";
import { PagedOfcCablesCompleteResult, UsePagedOfcCablesCompleteOptions } from "@/hooks/database/queries-type-helpers";

// RPC query hook with performance enhancements
export function useRpcQuery<T extends RpcFunctionName, TData = RpcFunctionReturns<T>>(supabase: SupabaseClient<Database>, functionName: T, args?: RpcFunctionArgs<T>, options?: UseRpcQueryOptions<T, TData>) {
  const { performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createRpcQueryKey(functionName, args, performance),
    queryFn: async (): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(functionName, args || ({} as RpcFunctionArgs<T>));
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    staleTime: 3 * 60 * 1000,
    ...queryOptions,
  });
}

// Enhanced RPC mutation hook
export function useRpcMutation<T extends RpcFunctionName>(supabase: SupabaseClient<Database>, functionName: T, options?: UseTableMutationOptions<RpcFunctionReturns<T>, RpcFunctionArgs<T>>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, ...mutationOptions } = options || {};

  return useMutation({
    mutationFn: async (args: RpcFunctionArgs<T>): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(functionName, args || ({} as RpcFunctionArgs<T>));
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["rpc", functionName] });
        queryClient.invalidateQueries({ queryKey: ["table"] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * A specialized hook to fetch paginated data from the `v_systems_complete` view
 * using the high-performance RPC function.
 */
export function usePagedSystemsComplete(supabase: SupabaseClient<Database>, options: UsePagedSystemsCompleteOptions) {
  const { limit = 20, offset = 0, orderBy = "system_name", orderDir = "asc", filters = {}, queryOptions } = options;

  return useQuery<PagedSystemsCompleteResult, Error>({
    queryKey: ["v_systems_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_v_systems_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged systems:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_system_connections_complete view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedSystemConnectionsComplete(
  supabase: SupabaseClient<Database>,
  options: UsePagedSystemConnectionsCompleteOptions
): UseQueryResult<PagedSystemConnectionsCompleteResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "system_name", // Default order_by is a valid column
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedSystemConnectionsCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness and refetching when they change.
    queryKey: ["v_system_connections_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      // Call the Supabase RPC function with the specified parameters.
      const { data, error } = await supabase.rpc("get_paged_system_connections_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged system connections:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options for flexibility (e.g., enabled, staleTime).
    ...queryOptions,
  });
}

/**
 * A specialized hook to fetch paginated and filtered data from the 
 * `v_ofc_cables_complete` view using the high-performance RPC function.
 */
export function usePagedOfcCablesComplete(supabase: SupabaseClient<Database>, options: UsePagedOfcCablesCompleteOptions): UseQueryResult<PagedOfcCablesCompleteResult, Error> {
  const { 
    limit = 10, 
    offset = 0, 
    orderBy = "route_name", 
    orderDir = "asc", 
    filters = {}, 
    queryOptions 
  } = options;

  return useQuery<PagedOfcCablesCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness
    queryKey: ["v_ofc_cables_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_ofc_cables_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged OFC cables:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_ofc_connections_complete view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedOfcConnectionsComplete(
  supabase: SupabaseClient<Database>,
  options: UsePagedOfcConnectionsCompleteOptions
): UseQueryResult<PagedOfcConnectionsCompleteResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "ofc_route_name", // Default order_by is a valid column
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedOfcConnectionsCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness and refetching when they change.
    queryKey: ["v_ofc_connections_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      // Call the Supabase RPC function with the specified parameters.
      const { data, error } = await supabase.rpc("get_paged_ofc_connections_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged OFC connections:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options for flexibility (e.g., enabled, staleTime).
    ...queryOptions,
  });
}


export function usePagedNodesComplete(supabase: SupabaseClient<Database>, options: UsePagedNodesCompleteOptions) {
  const { limit = 10, offset = 0, orderBy = "name", orderDir = "asc", filters = {}, queryOptions } = options;

  return useQuery<PagedNodesCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness
    queryKey: ["v_nodes_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_nodes_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged nodes:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_lookup_types_with_count view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedLookupTypesWithCount(
  supabase: SupabaseClient<Database>,
  options: UsePagedLookupTypesWithCountOptions
): UseQueryResult<PagedLookupTypesWithCountResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "name",
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedLookupTypesWithCountResult, Error>({
    queryKey: ["v_lookup_types_with_count", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_lookup_types_with_count", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged lookup types:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_maintenance_areas_with_count view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedMaintenanceAreasWithCount(
  supabase: SupabaseClient<Database>,
  options: UsePagedMaintenanceAreasWithCountOptions
): UseQueryResult<PagedMaintenanceAreasWithCountResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "name",
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedMaintenanceAreasWithCountResult, Error>({
    queryKey: ["v_maintenance_areas_with_count", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_maintenance_areas_with_count", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged maintenance areas:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_employee_designations_with_count view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedEmployeeDesignationsWithCount(
  supabase: SupabaseClient<Database>,
  options: UsePagedEmployeeDesignationsWithCountOptions
): UseQueryResult<PagedEmployeeDesignationsWithCountResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "name",
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedEmployeeDesignationsWithCountResult, Error>({
    queryKey: ["v_employee_designations_with_count", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_employee_designations_with_count", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged employee designations:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_employees_with_count view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedEmployeesWithCount(
  supabase: SupabaseClient<Database>,
  options: UsePagedEmployeesWithCountOptions
): UseQueryResult<PagedEmployeesWithCountResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "employee_name",
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedEmployeesWithCountResult, Error>({
    queryKey: ["v_employees_with_count", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_employees_with_count", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged employees:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_rings_with_count view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedRingsWithCount(
  supabase: SupabaseClient<Database>,
  options: UsePagedRingsWithCountOptions
): UseQueryResult<PagedRingsWithCountResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "name",
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedRingsWithCountResult, Error>({
    queryKey: ["v_rings_with_count", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_rings_with_count", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged rings:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}




export function useDashboardOverview(supabase: SupabaseClient<Database>, options: UseRpcQueryOptions<"get_dashboard_overview">) {
  return useRpcQuery(supabase, "get_dashboard_overview", {}, options);
}

// Lookup type hooks
export function useGetLookupTypeId(supabase: SupabaseClient<Database>, category: string, name: string, options?: UseRpcQueryOptions<"get_lookup_type_id">) {
  return useRpcQuery(supabase, "get_lookup_type_id", { p_category: category, p_name: name }, options);
}

export function useGetLookupTypesByCategory(supabase: SupabaseClient<Database>, category: string, options?: UseRpcQueryOptions<"get_lookup_types_by_category">) {
  return useRpcQuery(supabase, "get_lookup_types_by_category", { p_category: category }, options);
}

export function useAddLookupType(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<string, RpcFunctionArgs<"add_lookup_type">>) {
  return useRpcMutation(supabase, "add_lookup_type", options);
}

// User-related hooks
export function useGetMyUserDetails(supabase: SupabaseClient<Database>, options?: UseRpcQueryOptions<"get_my_user_details">) {
  return useRpcQuery(supabase, "get_my_user_details", {}, options);
}

export function useGetMyRole(supabase: SupabaseClient<Database>, options?: UseRpcQueryOptions<"get_my_role">) {
  return useRpcQuery(supabase, "get_my_role", {}, options);
}

export function useIsSuperAdmin(supabase: SupabaseClient<Database>, options?: UseRpcQueryOptions<"is_super_admin">) {
  return useRpcQuery(supabase, "is_super_admin", {}, options);
}

// Admin function hooks
export function useAdminGetAllUsers(supabase: SupabaseClient<Database>, args?: RpcFunctionArgs<"admin_get_all_users">, options?: UseRpcQueryOptions<"admin_get_all_users">) {
  return useRpcQuery(supabase, "admin_get_all_users", args, options);
}

export function useAdminGetAllUsersExtended(supabase: SupabaseClient<Database>, args?: RpcFunctionArgs<"admin_get_all_users_extended">, options?: UseRpcQueryOptions<"admin_get_all_users_extended">) {
  return useRpcQuery(supabase, "admin_get_all_users_extended", args, options);
}

export function useAdminUpdateUserProfile(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_update_user_profile">>) {
  return useRpcMutation(supabase, "admin_update_user_profile", options);
}

export function useAdminBulkUpdateRole(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_bulk_update_role">>) {
  return useRpcMutation(supabase, "admin_bulk_update_role", options);
}

export function useAdminBulkUpdateStatus(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_bulk_update_status">>) {
  return useRpcMutation(supabase, "admin_bulk_update_status", options);
}

export function useAdminBulkDeleteUsers(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_bulk_delete_users">>) {
  return useRpcMutation(supabase, "admin_bulk_delete_users", options);
}



```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/cache-performance.ts -->
```typescript
import { useQueryClient, QueryClient } from "@tanstack/react-query";
import { Filters, RpcFunctionArgs, RpcFunctionName, RpcFunctionReturns, TableName, TableRow, UseTableQueryOptions } from "./queries-type-helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { applyFilters, applyOrdering, createQueryKey, createRpcQueryKey } from "./utility-functions";

// Performance monitoring hook
export function useQueryPerformance() {
  const queryClient = useQueryClient();

  const getQueryStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      inactiveQueries: queries.filter((q) => q.getObserversCount() === 0).length,
      fetchingQueries: queries.filter((q) => q.state.status === "pending").length,
      cacheSizeBytes: JSON.stringify(cache).length,
    };
  };

  const clearStaleQueries = () => {
    queryClient.removeQueries({
      predicate: (query) => query.isStale() && query.state.status !== "pending",
    });
  };

  const prefetchCriticalData = async (supabase: SupabaseClient<Database>, criticalTables: TableName[]) => {
    const promises = criticalTables.map((tableName) =>
      queryClient.prefetchQuery({
        queryKey: ["table", tableName],
        queryFn: async () => {
          const { data, error } = await supabase.from(tableName).select("*").limit(100);
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    );

    await Promise.all(promises);
  };

  return {
    getQueryStats,
    clearStaleQueries,
    prefetchCriticalData,
  };
}

// Specialized hooks for RPC functions (keeping existing ones)
// This type is generated automatically by the Supabase CLI!
// Define the return type with more precision
// Use `Array<T>` syntax for clarity and add `| null` to handle initial/error states.

// Enhanced cache utilities with performance optimizations
export const tableQueryUtils = {
  invalidateTable: (queryClient: QueryClient, tableName: string) => {
    queryClient.invalidateQueries({ queryKey: ["table", tableName] });
    queryClient.invalidateQueries({ queryKey: ["unique", tableName] });
  },

  invalidateAllTables: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["table"] });
    queryClient.invalidateQueries({ queryKey: ["unique"] });
  },

  invalidateRpc: (queryClient: QueryClient, functionName: string) => {
    queryClient.invalidateQueries({ queryKey: ["rpc", functionName] });
  },

  invalidateAllRpc: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["rpc"] });
  },

  prefetchTable: async <T extends TableName>(queryClient: QueryClient, supabase: SupabaseClient<Database>, tableName: T, options?: UseTableQueryOptions<T>) => {
    return queryClient.prefetchQuery({
      queryKey: createQueryKey(tableName, options?.filters, options?.columns, options?.orderBy, options?.deduplication, options?.aggregation, options?.limit, options?.offset),
      queryFn: async (): Promise<TableRow<T>[]> => {
        let query = supabase.from(tableName).select(options?.columns || "*");

        if (options?.filters) {
          query = applyFilters(query, options.filters);
        }

        if (options?.orderBy) {
          query = applyOrdering(query, options.orderBy);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as TableRow<T>[]) || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  },

  prefetchRpc: async <T extends RpcFunctionName>(queryClient: QueryClient, supabase: SupabaseClient<Database>, functionName: T, args?: RpcFunctionArgs<T>) => {
    return queryClient.prefetchQuery({
      queryKey: createRpcQueryKey(functionName, args),
      queryFn: async (): Promise<RpcFunctionReturns<T>> => {
        const { data, error } = await supabase.rpc(functionName, args || ({} as RpcFunctionArgs<T>));
        if (error) throw error;
        return data as RpcFunctionReturns<T>;
      },
      staleTime: 3 * 60 * 1000,
    });
  },

  // Optimized cache management
  setQueryData: <T extends TableName>(queryClient: QueryClient, tableName: T, data: TableRow<T>[], filters?: Filters, columns?: string) => {
    queryClient.setQueryData(createQueryKey(tableName, filters, columns), data);
  },

  getQueryData: <T extends TableName>(queryClient: QueryClient, tableName: T, filters?: Filters, columns?: string): TableRow<T>[] | undefined => {
    return queryClient.getQueryData(createQueryKey(tableName, filters, columns));
  },

  // Performance monitoring
  getTableCacheStats: (queryClient: QueryClient, tableName: string) => {
    const cache = queryClient.getQueryCache();
    const tableQueries = cache.findAll({
      queryKey: ["table", tableName],
    });

    return {
      queryCount: tableQueries.length,
      staleCount: tableQueries.filter((q) => q.isStale()).length,
      fetchingCount: tableQueries.filter((q) => q.state.status === "pending").length,
      errorCount: tableQueries.filter((q) => q.state.status === "error").length,
      totalDataSize: tableQueries.reduce((acc, query) => {
        const data = query.state.data;
        return acc + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  },

  // Cleanup utilities
  removeStaleQueries: (
    queryClient: QueryClient,
    maxAge = 10 * 60 * 1000 // 10 minutes
  ) => {
    queryClient.removeQueries({
      predicate: (query) => {
        const isOld = Date.now() - query.state.dataUpdatedAt > maxAge;
        return isOld && query.isStale() && query.state.status !== "pending";
      },
    });
  },

  // Batch operations
  batchInvalidate: (queryClient: QueryClient, operations: Array<{ type: "table" | "rpc"; name: string }>) => {
    operations.forEach(({ type, name }) => {
      queryClient.invalidateQueries({ queryKey: [type, name] });
    });
  },
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/queries-type-helpers.ts -->
```typescript
// hooks/database/queries-type-helpers.ts

import { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query";
import { Database, Tables, TablesInsert, TablesUpdate, Json } from "@/types/supabase-types";

// --- TYPE HELPERS ---

// The type to include Date as a possible type
export type TableInsertWithDates<T extends TableName> = {
  [K in keyof TablesInsert<T>]?: TablesInsert<T>[K] | Date | null;
};

export type TableUpdateWithDates<T extends TableName> = {
  [K in keyof TablesUpdate<T>]?: TablesUpdate<T>[K] | Date | null;
};

// A table is a source that can be read from and written to.
export type TableName = keyof Database["public"]["Tables"];

// Auth tables are tables that can only be read from.
export type AuthTable = keyof Database["auth"]["Tables"];

// A view is a source that can only be read from.
export type ViewName = keyof Database["public"]["Views"];

// A generic type for any readable source (table or view).
export type TableOrViewName = TableName | ViewName;

// A generic type for any readable source (table or view).
export type AuthTableOrViewName = AuthTable | ViewName | TableName;

// Helper function to check if the table name is a table (not a view)
export const isTableName = (name: AuthTableOrViewName): name is TableName => {
  // List of view names - add your view names here
  const viewNames = [
    'v_nodes_complete',
    'v_ofc_cables_complete',
    'v_ofc_connections_complete',
    'v_system_connections_complete',
    'v_systems_complete',
    // 'vmux_connections',
    // 'vmux_systems',
    // Add other view names here
  ];
  const authViewNames = [
    'users',
  ];
  return !viewNames.includes(name as string) && !authViewNames.includes(name as string);
};

// Table-specific types for mutation operations (insert, update, delete).
export type TableRow<T extends TableName> = Tables<T>;
export type TableInsert<T extends TableName> = TablesInsert<T>;
export type TableUpdate<T extends TableName> = TablesUpdate<T>;

// A generic row type for any read operation (works with both tables and views).
export type Row<T extends AuthTableOrViewName> = T extends TableName ? Tables<T> : T extends ViewName ? Database["public"]["Views"][T]["Row"] : T extends AuthTable ? Database["auth"]["Tables"][T]["Row"] : never;

// RPC function type helpers.
export type RpcFunctionName = keyof Database["public"]["Functions"];
export type RpcFunctionArgs<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Args"];
export type RpcFunctionReturns<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Returns"];

// --- ADVANCED TYPES FOR HOOK OPTIONS ---

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "contains" | "containedBy" | "overlaps" | "sl" | "sr" | "nxl" | "nxr" | "adj" | "is" | "isdistinct" | "fts" | "plfts" | "phfts" | "wfts" | "or";

export type FilterValue = string | number | boolean | null | string[] | number[] | { operator: FilterOperator; value: unknown };

export type Filters = Record<string, FilterValue>;

export type OrderBy = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
};

export type DeduplicationOptions = {
  columns: string[];
  orderBy?: OrderBy[];
};

export type AggregationOptions = {
  count?: boolean | string;
  sum?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
  groupBy?: string[];
};

export type PerformanceOptions = {
  useIndex?: string;
  explain?: boolean;
  timeout?: number;
  connection?: "read" | "write";
};

// The shape of data returned by queries, potentially with a total count.
export type RowWithCount<T> = T & { total_count?: number };

// --- HOOK OPTIONS INTERFACES ---

// Options for querying multiple records from tables OR views.
export interface UseTableQueryOptions<T extends TableOrViewName, TData = RowWithCount<Row<T>>[]> extends Omit<UseQueryOptions<RowWithCount<Row<T>>[], Error, TData>, "queryKey" | "queryFn"> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  deduplication?: DeduplicationOptions;
  aggregation?: AggregationOptions;
  performance?: PerformanceOptions;
  includeCount?: boolean;
}

// Options for infinite scrolling over tables OR views.
export type InfiniteQueryPage<T extends TableOrViewName> = {
  data: Row<T>[];
  nextCursor?: number;
  count?: number;
};

export interface UseTableInfiniteQueryOptions<T extends TableOrViewName, TData = InfiniteData<InfiniteQueryPage<T>>>
  extends Omit<UseInfiniteQueryOptions<InfiniteQueryPage<T>, Error, TData, readonly unknown[], number | undefined>, "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  pageSize?: number;
  performance?: PerformanceOptions;
}

// Options for querying a single record from a table OR view.
export interface UseTableRecordOptions<T extends TableOrViewName, TData = Row<T> | null> extends Omit<UseQueryOptions<Row<T> | null, Error, TData>, "queryKey" | "queryFn"> {
  columns?: string;
  performance?: PerformanceOptions;
}

// Options for getting unique values from a table OR view.
export interface UseUniqueValuesOptions<T extends TableOrViewName, TData = unknown[]> extends Omit<UseQueryOptions<unknown[], Error, TData>, "queryKey" | "queryFn"> {
  tableName: T;
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  performance?: PerformanceOptions;
}

export interface UseRpcQueryOptions<T extends RpcFunctionName, TData = RpcFunctionReturns<T>> extends Omit<UseQueryOptions<RpcFunctionReturns<T>, Error, TData>, "queryKey" | "queryFn"> {
  performance?: PerformanceOptions;
}

// Options for mutations, which apply ONLY to tables.
export interface UseTableMutationOptions<TData = unknown, TVariables = unknown, TContext = unknown> extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, "mutationFn"> {
  invalidateQueries?: boolean;
  optimisticUpdate?: boolean;
  batchSize?: number;
}

export interface OptimisticContext {
  previousData?: [readonly unknown[], unknown][];
}

export type PagedSystemsCompleteResult = Array<Database["public"]["Functions"]["get_paged_v_systems_complete"]["Returns"][number]> | null;

export type UsePagedSystemsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedSystemsCompleteResult>, "queryKey" | "queryFn">;
};

// --- TYPES FOR EXCEL UPLOAD HOOK ---

/**
 * Defines how to map a column from the Excel file to a database column.
 * @template T - The name of the table to upload to.
 */
export interface UploadColumnMapping<T extends TableName> {
  /** The exact header name in the Excel file (e.g., "Product Name"). */
  excelHeader: string;
  /** The corresponding key in the database table (e.g., "product_name"). */
  dbKey: keyof TableInsert<T> & string;
  /** An optional function to transform the cell's value before uploading. */
  transform?: (value: unknown) => unknown;
  /** If true, the value must be non-empty after transform; otherwise the row is rejected. */
  required?: boolean;
}

/**
 * Specifies the type of upload operation to perform.
 * - 'insert': Adds all rows as new records. Fails if a record violates a unique constraint.
 * - 'upsert': Inserts new records or updates existing ones based on a conflict column.
 */
export type UploadType = "insert" | "upsert";

/**
 * Options required to initiate an Excel file upload.
 * @template T - The name of the table to upload to.
 */
export interface UploadOptions<T extends TableName> {
  /** The file object from a file input element. */
  file: File;
  /** An array defining how to map Excel columns to database columns. */
  columns: UploadColumnMapping<T>[];
  /** The type of database operation to perform. Defaults to 'upsert'. */
  uploadType?: UploadType;
  /**
   * The database column to use for conflict resolution in an 'upsert' operation.
   * This is REQUIRED for 'upsert'.
   * e.g., 'id' or 'sku' if you want to update rows with matching IDs or SKUs.
   */
  conflictColumn?: keyof TableInsert<T> & string;
}

/**
 * The result of a successful upload operation.
 */
export interface UploadResult {
  successCount: number;
  errorCount: number;
  totalRows: number;
  errors: { rowIndex: number; data: unknown; error: string }[];
}

/**
 * Configuration options for the useExcelUpload hook itself.
 * @template T - The name of the table to upload to.
 */
export interface UseExcelUploadOptions<T extends TableName> {
  onSuccess?: (data: UploadResult, variables: UploadOptions<T>) => void;
  onError?: (error: Error, variables: UploadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
}

// FIX: Add the return type for the new RPC function
export type PagedOfcCablesCompleteResult = 
  Array<Database["public"]["Functions"]["get_paged_ofc_cables_complete"]["Returns"][number]> | null;

// FIX: Add the options type for the new hook we will create
export type UsePagedOfcCablesCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedOfcCablesCompleteResult, Error>, "queryKey" | "queryFn">;
};

export type PagedNodesCompleteResult = Array<Database["public"]["Functions"]["get_paged_nodes_complete"]["Returns"][number]> | null;

export type UsePagedNodesCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedNodesCompleteResult, Error>, "queryKey" | "queryFn">;
};

export type PagedOfcConnectionsCompleteResult = 
  Array<Database["public"]["Functions"]["get_paged_ofc_connections_complete"]["Returns"][number]> | null;

// FIX: Add the options type for the new hook we will create
export type UsePagedOfcConnectionsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedOfcConnectionsCompleteResult, Error>, "queryKey" | "queryFn">;
};

export type PagedSystemConnectionsCompleteResult = Array<Database["public"]["Functions"]["get_paged_system_connections_complete"]["Returns"][number]> | null;

export type UsePagedSystemConnectionsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedSystemConnectionsCompleteResult>, "queryKey" | "queryFn">;
};

export type PagedLookupTypesWithCountResult = Array<Database["public"]["Functions"]["get_paged_lookup_types_with_count"]["Returns"][number]> | null;

export type UsePagedLookupTypesWithCountOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedLookupTypesWithCountResult, Error>, "queryKey" | "queryFn">;
};

export type PagedMaintenanceAreasWithCountResult = Array<Database["public"]["Functions"]["get_paged_maintenance_areas_with_count"]["Returns"][number]> | null;

export type UsePagedMaintenanceAreasWithCountOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedMaintenanceAreasWithCountResult, Error>, "queryKey" | "queryFn">;
};

export type PagedEmployeeDesignationsWithCountResult = Array<Database["public"]["Functions"]["get_paged_employee_designations_with_count"]["Returns"][number]> | null;

export type UsePagedEmployeeDesignationsWithCountOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedEmployeeDesignationsWithCountResult, Error>, "queryKey" | "queryFn">;
};

export type PagedEmployeesWithCountResult = Array<Database["public"]["Functions"]["get_paged_employees_with_count"]["Returns"][number]> | null;

export type UsePagedEmployeesWithCountOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedEmployeesWithCountResult, Error>, "queryKey" | "queryFn">;
};

export type PagedRingsWithCountResult = Array<Database["public"]["Functions"]["get_paged_rings_with_count"]["Returns"][number]> | null;

export type UsePagedRingsWithCountOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedRingsWithCountResult, Error>, "queryKey" | "queryFn">;
};

// Define a type for the function's return data for full type safety
export type DashboardOverviewData = {
  system_status_counts: { [key: string]: number };
  node_status_counts: { [key: string]: number };
  path_operational_status: { [key: string]: number };
  cable_utilization_summary: {
    average_utilization_percent: number;
    high_utilization_count: number;
    total_cables: number;
  };
  user_activity_last_30_days: {
    date: string;
    count: number;
  }[];
  systems_per_maintenance_area: { [key: string]: number };
};
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/excel-queries/excel-helpers copy.ts -->
```typescript
// hooks/database/excel-queries.ts
import * as ExcelJS from "exceljs";
import { Filters, UploadResult } from "@/hooks/database";
import { AuthTableOrViewName, Row } from "@/hooks/database";

//================================================================================
// TYPES AND INTERFACES
//================================================================================

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  filterOptions?: { label: string; value: unknown }[];
  align?: "left" | "center" | "right";
  hidden?: boolean;
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage" | "json";
  excludeFromExport?: boolean;
}

// Generic RPC Configuration that works with any function
export interface RPCConfig<TParams = Record<string, unknown>> {
  functionName: string;
  parameters?: TParams;
  selectFields?: string;
}

// NOTE: T refers to a table/view name. Columns should describe a Row<T>.
export interface DownloadOptions<
  T extends AuthTableOrViewName = AuthTableOrViewName
> {
  fileName?: string;
  filters?: Filters;
  columns?: Column<Row<T>>[];
  sheetName?: string;
  maxRows?: number;
  customStyles?: ExcelStyles;
  rpcConfig?: RPCConfig;
}

export interface ExcelStyles {
  headerFont?: Partial<ExcelJS.Font>;
  headerFill?: ExcelJS.FillPattern;
  dataFont?: Partial<ExcelJS.Font>;
  alternateRowFill?: ExcelJS.FillPattern;
  borderStyle?: Partial<ExcelJS.Borders>;
}

export interface ExcelDownloadResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
}

export interface UseExcelDownloadOptions<
  T extends AuthTableOrViewName = AuthTableOrViewName
> {
  onSuccess?: (
    data: ExcelDownloadResult,
    variables: DownloadOptions<T>
  ) => void;
  onError?: (error: Error, variables: DownloadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
  defaultRPCConfig?: RPCConfig;
}

// Enhanced error tracking interfaces
export interface ValidationError {
  rowIndex: number;
  column: string;
  value: unknown;
  error: string;
  data?: Record<string, unknown>;
}

export interface ProcessingLog {
  rowIndex: number;
  excelRowNumber: number;
  originalData: Record<string, unknown>;
  processedData: Record<string, unknown>;
  validationErrors: ValidationError[];
  isSkipped: boolean;
  skipReason?: string;
}

export interface EnhancedUploadResult extends UploadResult {
  processingLogs: ProcessingLog[];
  validationErrors: ValidationError[];
  skippedRows: number;
}

//================================================================================
// UTILITY FUNCTIONS
//================================================================================

export const createFillPattern = (color: string): ExcelJS.FillPattern => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: color },
});

export const formatCellValue = <T = unknown>(
  value: unknown,
  column: Column<T>
): unknown => {
  if (value === null || value === undefined) return "";
  
  // Handle object values first
  if (typeof value === 'object' && value !== null) {
    // If it's a Date object
    if (value instanceof Date) {
      return value;
    }
    // If it's an array, join with comma
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // For other objects, try to stringify
    try {
      const str = JSON.stringify(value);
      // If it's a JSON object string, parse and get a simple string representation
      if (str.startsWith('{') || str.startsWith('[')) {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'object' && parsed !== null) {
          // For objects, get values and join
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
          return Object.values(parsed).filter(v => v !== undefined && v !== null).join(', ');
        }
        return String(parsed);
      }
      return str;
    } catch {
      return String(value);
    }
  }

  // Handle non-object values
  switch (column.excelFormat) {
    case "date":
      return value instanceof Date ? value : new Date(value as string);
    case "number":
      return typeof value === "string" ? parseFloat(value) || 0 : value;
    case "currency":
      return typeof value === "string"
        ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0
        : value;
    case "percentage":
      return typeof value === "number"
        ? value / 100
        : parseFloat(String(value)) / 100 || 0;
    case "json": {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed);
        } catch {
          return value;
        }
      }
      return String(value);
    }
    default:
      return String(value);
  }
};

export const applyCellFormatting = <T = unknown>(
  cell: ExcelJS.Cell,
  column: Column<T>
): void => {
  switch (column.excelFormat) {
    case "date":
      cell.numFmt = "mm/dd/yyyy";
      break;
    case "currency":
      cell.numFmt = '"$"#,##0.00';
      break;
    case "percentage":
      cell.numFmt = "0.00%";
      break;
    case "number":
      cell.numFmt = "#,##0.00";
      break;
  }
  if (column.align) {
    cell.alignment = { horizontal: column.align };
  }
};

export const getDefaultStyles = (): ExcelStyles => ({
  headerFont: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
  headerFill: createFillPattern("FF2563EB"),
  dataFont: { size: 11 },
  alternateRowFill: createFillPattern("FFF8F9FA"),
  borderStyle: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
});

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-z0-9.-]/gi, "_").replace(/_{2,}/g, "_");
};

export const convertFiltersToRPCParams = (
  filters?: Filters
): Record<string, unknown> => {
  if (!filters) return {};

  const rpcParams: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      rpcParams[key] = value;
    }
  });

  return rpcParams;
};

// Safe UUID generator: uses crypto.randomUUID if available, otherwise a lightweight fallback
export const generateUUID = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  // RFC4122 version 4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Enhanced logging utilities
export const logRowProcessing = (
  rowIndex: number,
  excelRowNumber: number,
  originalData: Record<string, unknown>,
  processedData: Record<string, unknown>,
  validationErrors: ValidationError[] = [],
  isSkipped = false,
  skipReason?: string
): ProcessingLog => {
  const log: ProcessingLog = {
    rowIndex,
    excelRowNumber,
    originalData,
    processedData,
    validationErrors,
    isSkipped,
    skipReason,
  };

  console.group(`🔍 Processing Row ${excelRowNumber} (Index: ${rowIndex})`);
  console.log("📊 Original Data:", originalData);
  console.log("🔄 Processed Data:", processedData);

  if (validationErrors.length > 0) {
    console.warn("❌ Validation Errors:", validationErrors);
  }

  if (isSkipped) {
    console.warn("⏭️ Row Skipped:", skipReason);
  }

  console.groupEnd();

  return log;
};

export const logColumnTransformation = (
  rowIndex: number,
  column: string,
  originalValue: unknown,
  transformedValue: unknown,
  error?: string
): void => {
  console.log(`🔧 Column "${column}" (Row ${rowIndex + 2}):`);
  console.log(
    `   Original: ${JSON.stringify(originalValue)} (${typeof originalValue})`
  );
  console.log(
    `   Transformed: ${JSON.stringify(
      transformedValue
    )} (${typeof transformedValue})`
  );

  if (error) {
    console.error(`   ❌ Error: ${error}`);
  }
};

// Enhanced value validation
export const validateValue = (
  value: unknown,
  columnName: string,
  isRequired: boolean
): ValidationError | null => {
  if (isRequired) {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (isEmpty) {
      return {
        rowIndex: -1, // Will be set by caller
        column: columnName,
        value,
        error: `Required field "${columnName}" is empty`,
      };
    }
  }

  // Type-specific validations
  if (value !== null && value !== undefined && value !== "") {
    // Check for UUID format if column suggests it's an ID
    if ((columnName === "id" || columnName.endsWith("_id") ) && columnName !== "transnet_id") {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const strValue = String(value).trim();
      if (strValue && !uuidRegex.test(strValue) && strValue !== "") {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid UUID format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for email format
    if (columnName.toLowerCase().includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strValue = String(value).trim();
      if (strValue && !emailRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid email format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for IP address format
    const isIPField =
      columnName === "ip_address" ||
      columnName.endsWith("_ip") ||
      columnName.includes("ipaddr");
    if (isIPField) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const strValue = String(value).trim();
      if (strValue && !ipRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid IP address format for "${columnName}": ${strValue}`,
        };
      }
    }
  }

  return null;
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/excel-queries/excel-download.ts -->
```typescript

import { AuthTableOrViewName, isTableName, Row, TableName, ViewName } from "../queries-type-helpers";
import * as ExcelJS from "exceljs";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation } from "@tanstack/react-query";
import { applyCellFormatting, convertFiltersToRPCParams, DownloadOptions, ExcelDownloadResult, formatCellValue, getDefaultStyles, RPCConfig, sanitizeFileName, UseExcelDownloadOptions } from "./excel-helpers";
import { toast } from "sonner";
import { applyFilters } from "../utility-functions";

// Extended types for new functionality
interface OrderByOption {
column: string;
ascending?: boolean;
}

interface EnhancedDownloadOptions<T extends AuthTableOrViewName> extends DownloadOptions<T> {
orderBy?: OrderByOption[];
wrapText?: boolean;
autoFitColumns?: boolean;
}

interface EnhancedUseExcelDownloadOptions<T extends AuthTableOrViewName> extends UseExcelDownloadOptions<T> {
defaultOrderBy?: OrderByOption[];
defaultWrapText?: boolean;
defaultAutoFitColumns?: boolean;
}

// Hook for RPC-based downloads with full type safety
export function useRPCExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    defaultOrderBy,
    defaultWrapText = true,
    defaultAutoFitColumns = true,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    EnhancedDownloadOptions<T> & { rpcConfig: RPCConfig }
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `export-${new Date().toISOString().split("T")[0]}.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          rpcConfig,
          orderBy,
          wrapText,
          autoFitColumns,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0)
          throw new Error("No columns specified for export");
        if (!rpcConfig)
          throw new Error("RPC configuration is required for this hook");

        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0)
          throw new Error("All columns are excluded from export");

        toast.info("Fetching data via RPC...");

        // Prepare RPC parameters
        const rpcParams = {
          ...rpcConfig.parameters,
          ...convertFiltersToRPCParams(filters),
        };

        if (maxRows) {
          rpcParams.row_limit = maxRows;
        }

        // Add ordering parameters to RPC if supported
        if (orderBy && orderBy.length > 0) {
          rpcParams.order_by = orderBy.map(order => 
            `${order.column}.${order.ascending !== false ? 'asc' : 'desc'}`
          ).join(',');
        }

        // Execute RPC call with proper error handling
        const { data, error } = await supabase.rpc(
          rpcConfig.functionName as keyof Database["public"]["Functions"],
          rpcParams
        );

        if (error) throw new Error(`RPC call failed: ${error.message}`);
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error("No data returned from RPC function");
        }

        // Ensure data is an array
        let dataArray = Array.isArray(data) ? data : [data];
        
        // Apply client-side ordering if RPC doesn't support it
        if (orderBy && orderBy.length > 0) {
          dataArray = dataArray.sort((a, b) => {
            for (const order of orderBy) {
              // Safe property access with type guards
              const aVal = (a && typeof a === 'object' && !Array.isArray(a)) 
                ? (a as Record<string, unknown>)[order.column] 
                : undefined;
              const bVal = (b && typeof b === 'object' && !Array.isArray(b)) 
                ? (b as Record<string, unknown>)[order.column] 
                : undefined;
              
              if (aVal === bVal) continue;
              
              let comparison = 0;
              if (aVal == null && bVal != null) comparison = 1;
              else if (aVal != null && bVal == null) comparison = -1;
              else if (aVal != null && bVal != null) {
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
              }
              
              return order.ascending !== false ? comparison : -comparison;
            }
            return 0;
          });
        }
        
        toast.success(
          `Fetched ${dataArray.length} records. Generating Excel file...`
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        // Set column properties with enhanced options
        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        // Add header row with enhanced styling
        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = 25;

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          
          // Enhanced header alignment with text wrapping
          cell.alignment = { 
            horizontal: "center", 
            vertical: "middle",
            wrapText: wrapText || false
          };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows with enhanced styling
        dataArray.forEach((record, rowIndex: number) => {
          // Ensure we only process object-like rows
          if (record === null || typeof record !== "object" || Array.isArray(record)) {
            return; // skip non-object rows
          }

          const obj = record as Record<string, unknown>;
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = String(col.dataIndex);
            const value = obj[key];
            rowData[key] = formatCellValue(value, col);
          });
          const excelRow = worksheet.addRow(rowData);

          // Enhanced cell styling with wrap text support
          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            // Apply text wrapping and alignment
            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top' // Better for wrapped text
            };

            applyCellFormatting(cell, col);

            if (styles.borderStyle) {
              const isLastDataRow = rowIndex === dataArray.length - 1;
              cell.border = {
                right: styles.borderStyle.right,
                left: colIndex === 0 ? styles.borderStyle.left : undefined,
                top: styles.borderStyle.top,
                bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
              };
            }
          });
        });

        // Auto-fit columns if enabled
        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            let maxLength = col.title.length;
            
            // Calculate max content length for auto-fitting
            dataArray.forEach((record) => {
              if (record && typeof record === "object" && !Array.isArray(record)) {
                const obj = record as Record<string, unknown>;
                const key = String(col.dataIndex);
                const value = obj[key];
                const cellText = String(formatCellValue(value, col) || '');
                
                // For wrapped text, consider line breaks
                if (wrapText) {
                  const lines = cellText.split('\n');
                  const maxLineLength = Math.max(...lines.map(line => line.length));
                  maxLength = Math.max(maxLength, maxLineLength);
                } else {
                  maxLength = Math.max(maxLength, cellText.length);
                }
              }
            });
            
            // Set reasonable bounds for column width
            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), 50);
            column.width = calculatedWidth;
          });
        }

        // Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        // Generate and download file
        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(
          `Excel file "${sanitizedFileName}" downloaded successfully!`
        );
        return {
          fileName: sanitizedFileName,
          rowCount: dataArray.length,
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (showToasts) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}

// // Hook for traditional table/view downloads with enhanced features
// export function useTableExcelDownload<T extends AuthTableOrViewName>(
//   supabase: SupabaseClient<Database>,
//   tableName: T,
//   options?: EnhancedUseExcelDownloadOptions<T>
// ) {
//   const {
//     showToasts = true,
//     batchSize = 50000,
//     defaultOrderBy,
//     defaultWrapText = true,
//     defaultAutoFitColumns = true,
//     ...mutationOptions
//   } = options || {};

//   return useMutation<
//     ExcelDownloadResult,
//     Error,
//     Omit<EnhancedDownloadOptions<T>, "rpcConfig">
//   >({
//     mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
//       try {
//         const defaultStyles = getDefaultStyles();
//         const mergedOptions = {
//           sheetName: "Data",
//           maxRows: batchSize,
//           customStyles: defaultStyles,
//           orderBy: defaultOrderBy,
//           wrapText: defaultWrapText,
//           autoFitColumns: defaultAutoFitColumns,
//           ...downloadOptions,
//         };

//         const {
//           fileName = `${String(tableName)}-${
//             new Date().toISOString().split("T")[0]
//           }.xlsx`,
//           filters,
//           columns,
//           sheetName,
//           maxRows,
//           orderBy,
//           wrapText,
//           autoFitColumns,
//         } = mergedOptions;

//         const styles = { ...defaultStyles, ...mergedOptions.customStyles };

//         if (!columns || columns.length === 0)
//           throw new Error("No columns specified for export");
//         const exportColumns = columns.filter((col) => !col.excludeFromExport);
//         if (exportColumns.length === 0)
//           throw new Error("All columns are excluded from export");

//         toast.info("Fetching data for download...");

//         const selectFields = exportColumns
//           .map((col) => col.dataIndex)
//           .join(",");
//         let query = isTableName(tableName)
//           ? supabase.from(tableName as TableName).select(selectFields)
//           : supabase.from(tableName as ViewName).select(selectFields);

//         if (filters) query = applyFilters(query, filters);
        
//         // Apply ordering to the Supabase query
//         if (orderBy && orderBy.length > 0) {
//           orderBy.forEach(order => {
//             query = query.order(order.column, { ascending: order.ascending !== false });
//           });
//         }
        
//         if (maxRows) query = query.limit(maxRows);

//         const { data, error } = await query;

//         if (error) throw new Error(`Failed to fetch data: ${error.message}`);
//         if (!data || data.length === 0)
//           throw new Error("No data found for the selected criteria");

//         const typedData = data as Row<T>[];
//         toast.success(
//           `Fetched ${typedData.length} records. Generating Excel file...`
//         );

//         // Excel generation logic with enhanced features
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet(sheetName || "Data");

//         worksheet.columns = exportColumns.map((col) => ({
//           key: String(col.dataIndex),
//           width: typeof col.width === "number" ? col.width / 8 : 20,
//         }));

//         const headerTitles = exportColumns.map((col) => col.title);
//         const headerRow = worksheet.addRow(headerTitles);
//         headerRow.height = wrapText ? 30 : 25; // Increase height for wrapped text

//         exportColumns.forEach((col, index) => {
//           const cell = headerRow.getCell(index + 1);
//           if (styles.headerFont) cell.font = styles.headerFont;
//           if (styles.headerFill) cell.fill = styles.headerFill;
          
//           // Enhanced header alignment with text wrapping
//           cell.alignment = { 
//             horizontal: "center", 
//             vertical: "middle",
//             wrapText: wrapText || false
//           };

//           if (styles.borderStyle) {
//             cell.border = {
//               top: styles.borderStyle.top,
//               bottom: styles.borderStyle.bottom,
//               right: styles.borderStyle.right,
//               left: index === 0 ? styles.borderStyle.left : undefined,
//             };
//           }
//         });

//         // Add data rows with enhanced styling
//         typedData.forEach((record, rowIndex) => {
//           const rowData: Record<string, unknown> = {};
//           exportColumns.forEach((col) => {
//             const key = col.dataIndex as keyof Row<T> & string;
//             rowData[key] = formatCellValue(record[key], col);
//           });
//           const excelRow = worksheet.addRow(rowData);
          
//           // Set row height for wrapped text
//           if (wrapText) {
//             excelRow.height = 20; // Minimum height, will auto-expand
//           }

//           exportColumns.forEach((col, colIndex) => {
//             const cell = excelRow.getCell(colIndex + 1);

//             if (styles.dataFont) cell.font = styles.dataFont;

//             if (rowIndex % 2 === 1 && styles.alternateRowFill) {
//               cell.fill = styles.alternateRowFill;
//             }

//             // Apply text wrapping and alignment
//             cell.alignment = {
//               ...cell.alignment,
//               wrapText: wrapText || false,
//               vertical: 'top' // Better for wrapped text
//             };

//             applyCellFormatting(cell, col);

//             if (styles.borderStyle) {
//               const isLastDataRow = rowIndex === typedData.length - 1;
//               cell.border = {
//                 right: styles.borderStyle.right,
//                 left: colIndex === 0 ? styles.borderStyle.left : undefined,
//                 top: styles.borderStyle.top,
//                 bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
//               };
//             }
//           });
//         });

//         // Auto-fit columns if enabled
//         if (autoFitColumns) {
//           exportColumns.forEach((col, index) => {
//             const column = worksheet.getColumn(index + 1);
//             let maxLength = col.title.length;
            
//             // Calculate max content length for auto-fitting
//             typedData.forEach((record) => {
//               const key = col.dataIndex as keyof Row<T> & string;
//               const value = record[key];
//               const cellText = String(formatCellValue(value, col) || '');
              
//               // For wrapped text, consider line breaks
//               if (wrapText) {
//                 const lines = cellText.split('\n');
//                 const maxLineLength = Math.max(...lines.map(line => line.length));
//                 maxLength = Math.max(maxLength, maxLineLength);
//               } else {
//                 maxLength = Math.max(maxLength, cellText.length);
//               }
//             });
            
//             // Set reasonable bounds for column width
//             const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), wrapText ? 30 : 50);
//             column.width = calculatedWidth;
//           });
//         }

//         // Freeze header row
//         worksheet.views = [{ state: "frozen", ySplit: 1 }];

//         // Generate and download file
//         const buffer = await workbook.xlsx.writeBuffer();
//         const sanitizedFileName = sanitizeFileName(fileName);
//         const blob = new Blob([buffer], {
//           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         });

//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = sanitizedFileName;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(link.href);

//         toast.success(
//           `Excel file "${sanitizedFileName}" downloaded successfully!`
//         );
//         return {
//           fileName: sanitizedFileName,
//           rowCount: dataArray.length,
//           columnCount: exportColumns.length,
//         };
//       } catch (error) {
//         const errorMessage =
//           error instanceof Error ? error.message : "Unknown error occurred";
//         if (showToasts) {
//           toast.error(`Download failed: ${errorMessage}`);
//         }
//         throw error;
//       }
//     },
//     ...mutationOptions,
//   });
// }

// Hook for traditional table/view downloads with enhanced features
export function useTableExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    defaultOrderBy,
    defaultWrapText = true,
    defaultAutoFitColumns = true,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    Omit<EnhancedDownloadOptions<T>, "rpcConfig">
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `${String(tableName)}-${
            new Date().toISOString().split("T")[0]
          }.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          orderBy,
          wrapText,
          autoFitColumns,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0)
          throw new Error("No columns specified for export");
        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0)
          throw new Error("All columns are excluded from export");

        toast.info("Fetching data for download...");

        const selectFields = exportColumns
          .map((col) => col.dataIndex)
          .join(",");
        let query = isTableName(tableName)
          ? supabase.from(tableName as TableName).select(selectFields)
          : supabase.from(tableName as ViewName).select(selectFields);

        if (filters) query = applyFilters(query, filters);
        
        // Apply ordering to the Supabase query
        if (orderBy && orderBy.length > 0) {
          orderBy.forEach(order => {
            query = query.order(order.column, { ascending: order.ascending !== false });
          });
        }
        
        if (maxRows) query = query.limit(maxRows);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch data: ${error.message}`);
        if (!data || data.length === 0)
          throw new Error("No data found for the selected criteria");

        const typedData = data as Row<T>[];
        toast.success(
          `Fetched ${typedData.length} records. Generating Excel file...`
        );

        // Excel generation logic with enhanced features
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = wrapText ? 30 : 25; // Increase height for wrapped text

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          
          // Enhanced header alignment with text wrapping
          cell.alignment = { 
            horizontal: "center", 
            vertical: "middle",
            wrapText: wrapText || false
          };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows with enhanced styling
        typedData.forEach((record, rowIndex) => {
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = col.dataIndex as keyof Row<T> & string;
            rowData[key] = formatCellValue(record[key], col);
          });
          const excelRow = worksheet.addRow(rowData);
          
          // Set row height for wrapped text
          if (wrapText) {
            excelRow.height = 20; // Minimum height, will auto-expand
          }

          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            // Apply text wrapping and alignment
            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top' // Better for wrapped text
            };

            applyCellFormatting(cell, col);

            if (styles.borderStyle) {
              const isLastDataRow = rowIndex === typedData.length - 1;
              cell.border = {
                right: styles.borderStyle.right,
                left: colIndex === 0 ? styles.borderStyle.left : undefined,
                top: styles.borderStyle.top,
                bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
              };
            }
          });
        });

        // Auto-fit columns if enabled
        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            let maxLength = col.title.length;
            
            // Calculate max content length for auto-fitting
            typedData.forEach((record) => {
              const key = col.dataIndex as keyof Row<T> & string;
              const value = record[key];
              const cellText = String(formatCellValue(value, col) || '');
              
              // For wrapped text, consider line breaks
              if (wrapText) {
                const lines = cellText.split('\n');
                const maxLineLength = Math.max(...lines.map(line => line.length));
                maxLength = Math.max(maxLength, maxLineLength);
              } else {
                maxLength = Math.max(maxLength, cellText.length);
              }
            });
            
            // Set reasonable bounds for column width
            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), wrapText ? 30 : 50);
            column.width = calculatedWidth;
          });
        }

        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(
          `Excel file "${sanitizedFileName}" downloaded successfully!`
        );
        return {
          fileName: sanitizedFileName,
          rowCount: typedData.length,
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (
          showToasts &&
          errorMessage !== "No data found for the selected criteria"
        ) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}
//   // Basic usage with ordering
// const mutation = useTableExcelDownload(supabase, 'users', {
//   defaultOrderBy: [
//     { column: 'created_at', ascending: false },
//     { column: 'name', ascending: true }
//   ]
// });

// // Download with custom options
// mutation.mutate({
//   columns: userColumns,
//   orderBy: [{ column: 'email', ascending: true }],
//   wrapText: true,
//   autoFitColumns: false,
//   fileName: 'user-report.xlsx'
// });

// // RPC download with ordering
// const rpcMutation = useRPCExcelDownload(supabase, {
//   defaultWrapText: false,
//   defaultOrderBy: [{ column: 'priority', ascending: false }]
// });
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/excel-queries/excel-helpers.ts -->
```typescript
// hooks/database/excel-queries.ts
import * as ExcelJS from "exceljs";
import { Filters, UploadResult } from "@/hooks/database";
import { AuthTableOrViewName, Row } from "@/hooks/database";

//================================================================================
// TYPES AND INTERFACES
//================================================================================

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  filterOptions?: { label: string; value: unknown }[];
  align?: "left" | "center" | "right";
  hidden?: boolean;
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage" | "json";
  excludeFromExport?: boolean;
}

// Generic RPC Configuration that works with any function
export interface RPCConfig<TParams = Record<string, unknown>> {
  functionName: string;
  parameters?: TParams;
  selectFields?: string;
}

// NOTE: T refers to a table/view name. Columns should describe a Row<T>.
export interface DownloadOptions<
  T extends AuthTableOrViewName = AuthTableOrViewName
> {
  fileName?: string;
  filters?: Filters;
  columns?: Column<Row<T>>[];
  sheetName?: string;
  maxRows?: number;
  customStyles?: ExcelStyles;
  rpcConfig?: RPCConfig;
}

export interface ExcelStyles {
  headerFont?: Partial<ExcelJS.Font>;
  headerFill?: ExcelJS.FillPattern;
  dataFont?: Partial<ExcelJS.Font>;
  alternateRowFill?: ExcelJS.FillPattern;
  borderStyle?: Partial<ExcelJS.Borders>;
}

export interface ExcelDownloadResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
}

export interface UseExcelDownloadOptions<
  T extends AuthTableOrViewName = AuthTableOrViewName
> {
  onSuccess?: (
    data: ExcelDownloadResult,
    variables: DownloadOptions<T>
  ) => void;
  onError?: (error: Error, variables: DownloadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
  defaultRPCConfig?: RPCConfig;
}

// Enhanced error tracking interfaces
export interface ValidationError {
  rowIndex: number;
  column: string;
  value: unknown;
  error: string;
  data?: Record<string, unknown>;
}

export interface ProcessingLog {
  rowIndex: number;
  excelRowNumber: number;
  originalData: Record<string, unknown>;
  processedData: Record<string, unknown>;
  validationErrors: ValidationError[];
  isSkipped: boolean;
  skipReason?: string;
}

export interface EnhancedUploadResult extends UploadResult {
  processingLogs: ProcessingLog[];
  validationErrors: ValidationError[];
  skippedRows: number;
}

//================================================================================
// UTILITY FUNCTIONS
//================================================================================

export const createFillPattern = (color: string): ExcelJS.FillPattern => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: color },
});

export const formatCellValue = <T = unknown>(
  value: unknown,
  column: Column<T>
): unknown => {
  if (value === null || value === undefined) return "";
  
  // Handle number types first
  if (typeof value === 'number') {
    return value;
  }
  
  // Handle object values
  if (typeof value === 'object' && value !== null) {
    // If it's a Date object
    if (value instanceof Date) {
      return value;
    }
    // If it's an array, join with comma
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // For other objects, try to stringify
    try {
      const str = JSON.stringify(value);
      // If it's a JSON object string, parse and get a simple string representation
      if (str.startsWith('{') || str.startsWith('[')) {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'object' && parsed !== null) {
          // For objects, get values and join
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
          return Object.values(parsed).filter(v => v !== undefined && v !== null).join(', ');
        }
        return String(parsed);
      }
      return str;
    } catch {
      return String(value);
    }
  }

  // Handle non-object values
  switch (column.excelFormat) {
    case "date":
      return value instanceof Date ? value : new Date(value as string);
    case "number":
      return typeof value === "string" ? parseFloat(value) || 0 : value;
    case "currency":
      return typeof value === "string"
        ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0
        : value;
    case "percentage":
      return typeof value === "number"
        ? value / 100
        : parseFloat(String(value)) / 100 || 0;
    case "json": {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed);
        } catch {
          return value;
        }
      }
      return String(value);
    }
    default:
      return String(value);
  }
};

export const applyCellFormatting = <T = unknown>(
  cell: ExcelJS.Cell,
  column: Column<T>
): void => {
  switch (column.excelFormat) {
    case "date":
      cell.numFmt = "mm/dd/yyyy";
      break;
    case "currency":
      cell.numFmt = '"$"#,##0.00';
      break;
    case "percentage":
      cell.numFmt = "0.00%";
      break;
    case "number":
      cell.numFmt = "#,##0.00";
      break;
  }
  if (column.align) {
    cell.alignment = { horizontal: column.align };
  }
};

export const getDefaultStyles = (): ExcelStyles => ({
  headerFont: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
  headerFill: createFillPattern("FF2563EB"),
  dataFont: { size: 11 },
  alternateRowFill: createFillPattern("FFF8F9FA"),
  borderStyle: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
});

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-z0-9.-]/gi, "_").replace(/_{2,}/g, "_");
};

export const convertFiltersToRPCParams = (
  filters?: Filters
): Record<string, unknown> => {
  if (!filters) return {};

  const rpcParams: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      rpcParams[key] = value;
    }
  });

  return rpcParams;
};

// Safe UUID generator: uses crypto.randomUUID if available, otherwise a lightweight fallback
export const generateUUID = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  // RFC4122 version 4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Enhanced logging utilities
export const logRowProcessing = (
  rowIndex: number,
  excelRowNumber: number,
  originalData: Record<string, unknown>,
  processedData: Record<string, unknown>,
  validationErrors: ValidationError[] = [],
  isSkipped = false,
  skipReason?: string
): ProcessingLog => {
  const log: ProcessingLog = {
    rowIndex,
    excelRowNumber,
    originalData,
    processedData,
    validationErrors,
    isSkipped,
    skipReason,
  };

  console.group(`🔍 Processing Row ${excelRowNumber} (Index: ${rowIndex})`);
  console.log("📊 Original Data:", originalData);
  console.log("🔄 Processed Data:", processedData);

  if (validationErrors.length > 0) {
    console.warn("❌ Validation Errors:", validationErrors);
  }

  if (isSkipped) {
    console.warn("⏭️ Row Skipped:", skipReason);
  }

  console.groupEnd();

  return log;
};

export const logColumnTransformation = (
  rowIndex: number,
  column: string,
  originalValue: unknown,
  transformedValue: unknown,
  error?: string
): void => {
  console.log(`🔧 Column "${column}" (Row ${rowIndex + 2}):`);
  console.log(
    `   Original: ${JSON.stringify(originalValue)} (${typeof originalValue})`
  );
  console.log(
    `   Transformed: ${JSON.stringify(
      transformedValue
    )} (${typeof transformedValue})`
  );

  if (error) {
    console.error(`   ❌ Error: ${error}`);
  }
};

// Enhanced value validation
export const validateValue = (
  value: unknown,
  columnName: string,
  isRequired: boolean
): ValidationError | null => {
  if (isRequired) {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (isEmpty) {
      return {
        rowIndex: -1, // Will be set by caller
        column: columnName,
        value,
        error: `Required field "${columnName}" is empty`,
      };
    }
  }

  // Type-specific validations
  if (value !== null && value !== undefined && value !== "") {
    // Check for UUID format if column suggests it's an ID
    if ((columnName === "id" || columnName.endsWith("_id") ) && columnName !== "transnet_id") {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const strValue = String(value).trim();
      if (strValue && !uuidRegex.test(strValue) && strValue !== "") {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid UUID format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for email format
    if (columnName.toLowerCase().includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strValue = String(value).trim();
      if (strValue && !emailRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid email format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for IP address format
    const isIPField =
      columnName === "ip_address" ||
      columnName.endsWith("_ip") ||
      columnName.includes("ipaddr");
    if (isIPField) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const strValue = String(value).trim();
      if (strValue && !ipRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid IP address format for "${columnName}": ${strValue}`,
        };
      }
    }
  }

  return null;
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/excel-queries/excel-download copy.ts -->
```typescript
import { AuthTableOrViewName, isTableName, Row, TableName, ViewName } from "../queries-type-helpers";
import * as ExcelJS from "exceljs";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation } from "@tanstack/react-query";
import { applyCellFormatting, convertFiltersToRPCParams, DownloadOptions, ExcelDownloadResult, formatCellValue, getDefaultStyles, RPCConfig, sanitizeFileName, UseExcelDownloadOptions } from "./excel-helpers";
import { toast } from "sonner";
import { applyFilters } from "../utility-functions";

// Hook for RPC-based downloads with full type safety
export function useRPCExcelDownload<T extends AuthTableOrViewName>(
    supabase: SupabaseClient<Database>,
    options?: UseExcelDownloadOptions<T>
  ) {
    const {
      showToasts = true,
      batchSize = 50000,
      ...mutationOptions
    } = options || {};
  
    return useMutation<
      ExcelDownloadResult,
      Error,
      DownloadOptions<T> & { rpcConfig: RPCConfig }
    >({
      mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
        try {
          const defaultStyles = getDefaultStyles();
          const mergedOptions = {
            sheetName: "Data",
            maxRows: batchSize,
            customStyles: defaultStyles,
            ...downloadOptions,
          };
  
          const {
            fileName = `export-${new Date().toISOString().split("T")[0]}.xlsx`,
            filters,
            columns,
            sheetName,
            maxRows,
            rpcConfig,
          } = mergedOptions;
  
          const styles = { ...defaultStyles, ...mergedOptions.customStyles };
  
          if (!columns || columns.length === 0)
            throw new Error("No columns specified for export");
          if (!rpcConfig)
            throw new Error("RPC configuration is required for this hook");
  
          const exportColumns = columns.filter((col) => !col.excludeFromExport);
          if (exportColumns.length === 0)
            throw new Error("All columns are excluded from export");
  
          toast.info("Fetching data via RPC...");
  
          // Prepare RPC parameters
          const rpcParams = {
            ...rpcConfig.parameters,
            ...convertFiltersToRPCParams(filters),
          };
  
          if (maxRows) {
            rpcParams.row_limit = maxRows;
          }
  
          // Execute RPC call with proper error handling
          const { data, error } = await supabase.rpc(
            rpcConfig.functionName as keyof Database["public"]["Functions"],
            rpcParams
          );
  
          if (error) throw new Error(`RPC call failed: ${error.message}`);
          if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error("No data returned from RPC function");
          }
  
          // Ensure data is an array
          const dataArray = Array.isArray(data) ? data : [data];
          toast.success(
            `Fetched ${dataArray.length} records. Generating Excel file...`
          );
  
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet(sheetName || "Data");
  
          // Set column properties
          worksheet.columns = exportColumns.map((col) => ({
            key: String(col.dataIndex),
            width: typeof col.width === "number" ? col.width / 8 : 20,
          }));
  
          // Add header row
          const headerTitles = exportColumns.map((col) => col.title);
          const headerRow = worksheet.addRow(headerTitles);
          headerRow.height = 25;
  
          exportColumns.forEach((col, index) => {
            const cell = headerRow.getCell(index + 1);
            if (styles.headerFont) cell.font = styles.headerFont;
            if (styles.headerFill) cell.fill = styles.headerFill;
            cell.alignment = { horizontal: "center", vertical: "middle" };
  
            if (styles.borderStyle) {
              cell.border = {
                top: styles.borderStyle.top,
                bottom: styles.borderStyle.bottom,
                right: styles.borderStyle.right,
                left: index === 0 ? styles.borderStyle.left : undefined,
              };
            }
          });
  
          // Add data rows
          dataArray.forEach((record, rowIndex: number) => {
            // Ensure we only process object-like rows (Supabase RPC returns Json which can be null/primitive/array/object)
            if (record === null || typeof record !== "object" || Array.isArray(record)) {
              return; // skip non-object rows
            }
  
            const obj = record as Record<string, unknown>;
            const rowData: Record<string, unknown> = {};
            exportColumns.forEach((col) => {
              const value = obj[col.dataIndex];
              const key = col.dataIndex as keyof Row<T> & string;
              rowData[key] = formatCellValue(value, col);
            });
            const excelRow = worksheet.addRow(rowData);
  
            // Style each cell
            exportColumns.forEach((col, colIndex) => {
              const cell = excelRow.getCell(colIndex + 1);
  
              if (styles.dataFont) cell.font = styles.dataFont;
  
              if (rowIndex % 2 === 1 && styles.alternateRowFill) {
                cell.fill = styles.alternateRowFill;
              }
  
              applyCellFormatting(cell, col);
  
              if (styles.borderStyle) {
                const isLastDataRow = rowIndex === dataArray.length - 1;
                cell.border = {
                  right: styles.borderStyle.right,
                  left: colIndex === 0 ? styles.borderStyle.left : undefined,
                  top: styles.borderStyle.top,
                  bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
                };
              }
            });
          });
  
          // Freeze header row
          worksheet.views = [{ state: "frozen", ySplit: 1 }];
  
          // Generate and download file
          const buffer = await workbook.xlsx.writeBuffer();
          const sanitizedFileName = sanitizeFileName(fileName);
          const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
  
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = sanitizedFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
  
          toast.success(
            `Excel file "${sanitizedFileName}" downloaded successfully!`
          );
          return {
            fileName: sanitizedFileName,
            rowCount: dataArray.length,
            columnCount: exportColumns.length,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          if (showToasts) {
            toast.error(`Download failed: ${errorMessage}`);
          }
          throw error;
        }
      },
      ...mutationOptions,
    });
  }
  
  // Hook for traditional table/view downloads (backward compatible)
  export function useTableExcelDownload<T extends AuthTableOrViewName>(
    supabase: SupabaseClient<Database>,
    tableName: T,
    options?: UseExcelDownloadOptions<T>
  ) {
    const {
      showToasts = true,
      batchSize = 50000,
      ...mutationOptions
    } = options || {};
  
    return useMutation<
      ExcelDownloadResult,
      Error,
      Omit<DownloadOptions<T>, "rpcConfig">
    >({
      mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
        try {
          const defaultStyles = getDefaultStyles();
          const mergedOptions = {
            sheetName: "Data",
            maxRows: batchSize,
            customStyles: defaultStyles,
            ...downloadOptions,
          };
  
          const {
            fileName = `${String(tableName)}-${
              new Date().toISOString().split("T")[0]
            }.xlsx`,
            filters,
            columns,
            sheetName,
            maxRows,
          } = mergedOptions;
  
          const styles = { ...defaultStyles, ...mergedOptions.customStyles };
  
          if (!columns || columns.length === 0)
            throw new Error("No columns specified for export");
          const exportColumns = columns.filter((col) => !col.excludeFromExport);
          if (exportColumns.length === 0)
            throw new Error("All columns are excluded from export");
  
          toast.info("Fetching data for download...");
  
          const selectFields = exportColumns
            .map((col) => col.dataIndex)
            .join(",");
          let query = isTableName(tableName)
            ? supabase.from(tableName as TableName).select(selectFields)
            : supabase.from(tableName as ViewName).select(selectFields);
  
          if (filters) query = applyFilters(query, filters);
          if (maxRows) query = query.limit(maxRows);
  
          const { data, error } = await query;
  
          if (error) throw new Error(`Failed to fetch data: ${error.message}`);
          if (!data || data.length === 0)
            throw new Error("No data found for the selected criteria");
  
          const typedData = data as Row<T>[];
          toast.success(
            `Fetched ${typedData.length} records. Generating Excel file...`
          );
  
          // Excel generation logic (same as before)
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet(sheetName || "Data");
  
          worksheet.columns = exportColumns.map((col) => ({
            key: String(col.dataIndex), // Convert to string to ensure type safety
            width: typeof col.width === "number" ? col.width / 8 : 20,
          }));
  
          const headerTitles = exportColumns.map((col) => col.title);
          const headerRow = worksheet.addRow(headerTitles);
          headerRow.height = 25;
  
          exportColumns.forEach((col, index) => {
            const cell = headerRow.getCell(index + 1);
            if (styles.headerFont) cell.font = styles.headerFont;
            if (styles.headerFill) cell.fill = styles.headerFill;
            cell.alignment = { horizontal: "center", vertical: "middle" };
  
            if (styles.borderStyle) {
              cell.border = {
                top: styles.borderStyle.top,
                bottom: styles.borderStyle.bottom,
                right: styles.borderStyle.right,
                left: index === 0 ? styles.borderStyle.left : undefined,
              };
            }
          });
  
          typedData.forEach((record, rowIndex) => {
            const rowData: Record<string, unknown> = {};
            exportColumns.forEach((col) => {
              const key = col.dataIndex as keyof Row<T> & string;
              rowData[key] = formatCellValue(record[key], col);
            });
            const excelRow = worksheet.addRow(rowData);
  
            exportColumns.forEach((col, colIndex) => {
              const cell = excelRow.getCell(colIndex + 1);
  
              if (styles.dataFont) cell.font = styles.dataFont;
  
              if (rowIndex % 2 === 1 && styles.alternateRowFill) {
                cell.fill = styles.alternateRowFill;
              }
  
              applyCellFormatting(cell, col);
  
              if (styles.borderStyle) {
                const isLastDataRow = rowIndex === typedData.length - 1;
                cell.border = {
                  right: styles.borderStyle.right,
                  left: colIndex === 0 ? styles.borderStyle.left : undefined,
                  top: styles.borderStyle.top,
                  bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
                };
              }
            });
          });
  
          worksheet.views = [{ state: "frozen", ySplit: 1 }];
  
          const buffer = await workbook.xlsx.writeBuffer();
          const sanitizedFileName = sanitizeFileName(fileName);
          const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
  
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = sanitizedFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
  
          toast.success(
            `Excel file "${sanitizedFileName}" downloaded successfully!`
          );
          return {
            fileName: sanitizedFileName,
            rowCount: typedData.length,
            columnCount: exportColumns.length,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          if (
            showToasts &&
            errorMessage !== "No data found for the selected criteria"
          ) {
            toast.error(`Download failed: ${errorMessage}`);
          }
          throw error;
        }
      },
      ...mutationOptions,
    });
  }
  
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/excel-queries/index.ts -->
```typescript
export * from "./excel-download";
export * from "./excel-upload";
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/database/excel-queries/excel-upload.ts -->
```typescript
import * as XLSX from "xlsx";
import { TableInsert, TableName, UploadOptions, UseExcelUploadOptions } from "../queries-type-helpers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EnhancedUploadResult, generateUUID, logColumnTransformation, logRowProcessing, ProcessingLog, validateValue, ValidationError } from "./excel-helpers";
import { toast } from "sonner";

//================================================================================
// UPLOAD FUNCTIONS
//================================================================================

/**
 * Reads a File object and returns its contents as a 2D array using xlsx.
 * @param file The File object to read.
 * @returns A Promise that resolves to a 2D array of the sheet data.
 */
const parseExcelFile = (file: File): Promise<unknown[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          if (!event.target?.result) {
            throw new Error("File reading failed.");
          }
          const buffer = event.target.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: "array" });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          if (!worksheet) {
            throw new Error("No worksheet found in the file.");
          }
          // header: 1 tells sheet_to_json to return an array of arrays
          // defval: '' preserves empty cells so column indices stay aligned
          const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: "",
          });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = (error) => {
        reject(new Error(`FileReader error: ${error.type}`));
      };
  
      reader.readAsArrayBuffer(file);
    });
  };
  
  //================================================================================
  // MAIN ENHANCED UPLOAD HOOK
  //================================================================================
  
  /**
   * Enhanced React hook for uploading data from an Excel file to a Supabase table using 'xlsx'.
   * Includes comprehensive logging and error tracking.
   */
  export function useExcelUpload<T extends TableName>(
    supabase: SupabaseClient<Database>,
    tableName: T,
    options?: UseExcelUploadOptions<T>
  ) {
    const {
      showToasts = true,
      batchSize = 500,
      ...mutationOptions
    } = options || {};
    const queryClient = useQueryClient();
  
    return useMutation<EnhancedUploadResult, Error, UploadOptions<T>>({
      mutationFn: async (
        uploadOptions: UploadOptions<T>
      ): Promise<EnhancedUploadResult> => {
        const {
          file,
          columns,
          uploadType = "upsert",
          conflictColumn,
        } = uploadOptions;
  
        console.group("🚀 Excel Upload Process Started");
        console.log("📁 File:", file.name, `(${file.size} bytes)`);
        console.log("🎯 Table:", tableName);
        console.log("📋 Upload Type:", uploadType);
        console.log("🔑 Conflict Column:", conflictColumn);
        console.log("📊 Column Mappings:", columns);
  
        if (uploadType === "upsert" && !conflictColumn) {
          throw new Error(
            "A 'conflictColumn' must be specified for 'upsert' operations."
          );
        }
  
        const processingLogs: ProcessingLog[] = [];
        const allValidationErrors: ValidationError[] = [];
  
        toast.info("Reading and parsing Excel file...");
  
        // 1. Parse the Excel file using our xlsx utility function
        const jsonData = await parseExcelFile(file);
  
        console.log("📊 Raw Excel Data:", {
          totalRows: jsonData.length,
          headers: jsonData[0],
          sampleData: jsonData.slice(1, 4), // Show first 3 data rows
        });
  
        if (!jsonData || jsonData.length < 2) {
          toast.warning(
            "No data found in the Excel file. (A header row and at least one data row are required)."
          );
          console.groupEnd();
          return { 
            successCount: 0, 
            errorCount: 0, 
            totalRows: 0, 
            errors: [],
            processingLogs,
            validationErrors: allValidationErrors,
            skippedRows: 0,
          };
        }
  
        // 2. Map Excel headers to their column index for efficient lookup
        const excelHeaders: string[] = jsonData[0] as string[];
        const headerMap: Record<string, number> = {};
        console.log("📝 Excel Headers:", excelHeaders);
        
        excelHeaders.forEach((header, index) => {
          const cleanHeader = String(header).trim().toLowerCase();
          headerMap[cleanHeader] = index;
          console.log(`   [${index}]: "${header}" -> "${cleanHeader}"`);
        });
        
        const isFirstColumnId =
          String(excelHeaders?.[0] ?? "").toLowerCase() === "id";
        console.log("🆔 First column is ID:", isFirstColumnId);
  
        // 3. Validate that all required columns from the mapping exist in the file
        const getHeaderIndex = (name: string): number | undefined =>
          headerMap[String(name).trim().toLowerCase()];
  
        console.group("🔍 Column Mapping Validation");
        for (const mapping of columns) {
          const idx = getHeaderIndex(mapping.excelHeader);
          console.log(`📍 "${mapping.excelHeader}" -> "${mapping.dbKey}":`, 
            idx !== undefined ? `Column ${idx}` : "❌ NOT FOUND");
          
          // Allow missing 'id' header so we can auto-generate UUIDs during processing
          if (idx === undefined && mapping.dbKey !== "id") {
            console.error(`❌ Required column "${mapping.excelHeader}" not found in Excel file`);
            throw new Error(
              `Required column "${mapping.excelHeader}" not found in the Excel file.`
            );
          }
        }
        console.groupEnd();
  
        toast.info(
          `Found ${jsonData.length - 1} rows. Preparing data for upload...`
        );
  
        // 4. Process rows and transform data into the format for Supabase
        const dataRows = jsonData.slice(1);
  
        // Helper: determine if a row is effectively empty (ignoring 'id')
        const isRowEffectivelyEmpty = (row: unknown[]): boolean => {
          for (const mapping of columns) {
            if (mapping.dbKey === "id") continue; // ignore id when checking emptiness
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            if (v !== undefined && String(v).trim() !== "") {
              return false; // has some non-empty value in a non-id column
            }
          }
          return true;
        };
  
        // Filter out rows that are empty across all non-id columns, keep index for error reporting
        const filteredRows = dataRows
          .map((row, idx) => ({ row: row as unknown[], idx }))
          .filter(({ row }) => !isRowEffectivelyEmpty(row));
  
        console.log(`🎯 Filtered ${dataRows.length} rows down to ${filteredRows.length} non-empty rows`);
  
        // Initialize upload result early to record pre-insert validation errors
        const uploadResult: EnhancedUploadResult = {
          successCount: 0,
          errorCount: 0,
          totalRows: 0,
          errors: [],
          processingLogs,
          validationErrors: allValidationErrors,
          skippedRows: 0,
        };
  
        let recordsToProcess: TableInsert<T>[] = [];

        // Helpers capture the hook's generic T via closure over tableName
        const insertBatch = async (
          rows: TableInsert<T>[]
        ) => {
          // T is a generic (union of table names) here; Supabase's overloads require a concrete table literal.
          // A localized cast is used to bridge this at the single boundary to Supabase.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).insert(rows as any);
        };

        const upsertBatch = async (
          rows: TableInsert<T>[],
          onConflict: string
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).upsert(rows as any, { onConflict });
        };

        const upsertOne = async (
          row: TableInsert<T>,
          onConflict: string
        ) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return supabase.from(tableName).upsert(row as any, { onConflict });
        };
  
        console.group("🔄 Row Processing Phase");
        
        for (let i = 0; i < filteredRows.length; i++) {
          const { row, idx } = filteredRows[i];
          const excelRowNumber = idx + 2; // +2 because Excel is 1-indexed and we skip header
          
          const originalData: Record<string, unknown> = {};
          const processedData: Record<string, unknown> = {};
          const rowValidationErrors: ValidationError[] = [];
          let isSkipped = false;
          let skipReason: string | undefined;
  
          // Build original data object for logging
          excelHeaders.forEach((header, headerIdx) => {
            originalData[header] = row[headerIdx];
          });
  
          // Secondary safeguard: determine if row has any meaningful non-id value
          const rowHasContent = columns.some((mapping) => {
            if (mapping.dbKey === "id") return false;
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            return v !== undefined && String(v).trim() !== "";
          });
  
          if (!rowHasContent) {
            // Skip rows that are effectively empty across non-id columns
            isSkipped = true;
            skipReason = "Row is empty across all non-id columns";
            uploadResult.skippedRows++;
            
            const log = logRowProcessing(
              i, 
              excelRowNumber, 
              originalData, 
              processedData, 
              rowValidationErrors, 
              isSkipped, 
              skipReason
            );
            processingLogs.push(log);
            continue;
          }
  
          // Process each column mapping
          for (const mapping of columns) {
            const colIndex = getHeaderIndex(mapping.excelHeader);
            // Guard: only index row when we have a valid column index
            let rawValue = colIndex !== undefined ? row[colIndex] : undefined;
  
            console.group(`🔧 Processing "${mapping.dbKey}" (Excel: "${mapping.excelHeader}")`);
            console.log(`📍 Column Index: ${colIndex}`);
            console.log(`📊 Raw Value:`, rawValue, `(${typeof rawValue})`);
  
            try {
              // Normalize empty strings to null for UUID-like fields
              if (
                (mapping.dbKey === "id" ||
                  mapping.dbKey.endsWith("_id") ||
                  mapping.dbKey === "parent_id") &&
                (rawValue === "" || rawValue === undefined)
              ) {
                rawValue = null;
                console.log("🔄 Normalized empty UUID field to null");
              }
  
              // Normalize IP address-like fields for inet columns: trim and empty -> null
              // Targets include: 'ip_address', any key ending with '_ip', or containing 'ipaddr'
              {
                const key = String(mapping.dbKey || "").toLowerCase();
                const isIPField =
                  key === "ip_address" ||
                  key.endsWith("_ip") ||
                  key.includes("ipaddr");
                if (isIPField && typeof rawValue === "string") {
                  const trimmed = rawValue.trim();
                  rawValue = trimmed === "" ? null : trimmed;
                  console.log("🌐 Processed IP field:", rawValue);
                }
              }
  
              // Only generate a UUID for `id` if the row actually has content
              if (mapping.dbKey === "id" && rowHasContent) {
                // If first Excel column is id/ID and current mapping is for 'id', auto-generate UUID when empty
                if (
                  isFirstColumnId &&
                  (rawValue === null ||
                    rawValue === undefined ||
                    String(rawValue).trim() === "")
                ) {
                  rawValue = generateUUID();
                  console.log("🆔 Generated UUID for empty ID:", rawValue);
                }
                // If 'id' header is entirely missing, still generate a UUID
                if (colIndex === undefined) {
                  rawValue = generateUUID();
                  console.log("🆔 Generated UUID for missing ID column:", rawValue);
                }
              }
  
              // Use the transform function if available, otherwise use the raw value
              let finalValue: unknown;
              if (mapping.transform) {
                try {
                  finalValue = mapping.transform(rawValue);
                  console.log("🔧 Transformed value:", finalValue, `(${typeof finalValue})`);
                } catch (transformError) {
                  const errorMsg = transformError instanceof Error 
                    ? transformError.message 
                    : "Transform function failed";
                  console.error("❌ Transform error:", errorMsg);
                  
                  const validationError: ValidationError = {
                    rowIndex: i,
                    column: mapping.dbKey,
                    value: rawValue,
                    error: `Transform failed for "${mapping.dbKey}": ${errorMsg}`,
                  };
                  rowValidationErrors.push(validationError);
                  allValidationErrors.push(validationError);
                  finalValue = rawValue; // Use raw value as fallback
                }
              } else {
                finalValue = rawValue;
              }
  
              // Validate the processed value
              const validationError = validateValue(
                finalValue, 
                mapping.dbKey, 
                mapping.required || false
              );
              
              if (validationError) {
                validationError.rowIndex = i;
                rowValidationErrors.push(validationError);
                allValidationErrors.push(validationError);
                console.error("❌ Validation failed:", validationError.error);
              }
  
              // Assign the processed value to the correct database key
              // Normalize empty strings to null to satisfy numeric/date/inet columns
              let assignValue =
                finalValue !== undefined
                  ? finalValue
                  : rawValue !== undefined
                  ? rawValue
                  : null;
              
              if (typeof assignValue === "string" && assignValue.trim() === "") {
                assignValue = null;
                console.log("🧹 Normalized empty string to null");
              }
              
              processedData[mapping.dbKey] = assignValue;
              console.log("✅ Final assigned value:", assignValue, `(${typeof assignValue})`);
  
              logColumnTransformation(
                i,
                mapping.dbKey,
                rawValue,
                assignValue
              );
  
            } catch (columnError) {
              const errorMsg = columnError instanceof Error 
                ? columnError.message 
                : "Unknown column processing error";
              console.error("💥 Column processing error:", errorMsg);
              
              const validationError: ValidationError = {
                rowIndex: i,
                column: mapping.dbKey,
                value: rawValue,
                error: `Column processing failed: ${errorMsg}`,
              };
              rowValidationErrors.push(validationError);
              allValidationErrors.push(validationError);
            } finally {
              console.groupEnd();
            }
          }
  
          // Check if row has validation errors
          const hasRequiredFieldErrors = rowValidationErrors.some(err => 
            err.error.includes("Required field") || err.error.includes("Missing required")
          );
  
          if (hasRequiredFieldErrors) {
            // Record a validation error for this row and skip it
            isSkipped = true;
            skipReason = `Validation failed: ${rowValidationErrors.map(e => e.error).join("; ")}`;
            uploadResult.errorCount += 1;
            uploadResult.skippedRows++;
            
            uploadResult.errors.push({
              rowIndex: excelRowNumber,
              data: processedData as Record<string, unknown>,
              error: skipReason,
            });
          } else {
            // Add to records to process
            recordsToProcess.push(processedData as TableInsert<T>);
          }
  
          // Log the complete row processing
          const log = logRowProcessing(
            i,
            excelRowNumber,
            originalData,
            processedData,
            rowValidationErrors,
            isSkipped,
            skipReason
          );
          processingLogs.push(log);
        }
        
        console.groupEnd(); // End Row Processing Phase
  
        console.log(`📊 Processing Summary:`);
        console.log(`   Total filtered rows: ${filteredRows.length}`);
        console.log(`   Records to process: ${recordsToProcess.length}`);
        console.log(`   Skipped rows: ${uploadResult.skippedRows}`);
        console.log(`   Validation errors: ${allValidationErrors.length}`);
  
        // Deduplicate by conflict columns to avoid Postgres error:
        // "ON CONFLICT DO UPDATE command cannot affect row a second time"
        if (uploadType === "upsert" && conflictColumn) {
          console.group("🔄 Deduplication Process");
          
          const conflictCols = String(conflictColumn)
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
  
          console.log("🎯 Conflict columns:", conflictCols);
  
          if (conflictCols.length > 0) {
            const seen = new Set<string>();
            const deduped: TableInsert<T>[] = [];
            let duplicateCount = 0;
            
            for (const rec of recordsToProcess) {
              const values = conflictCols.map((c) => (rec as Record<string, unknown>)[c]);
              const allPresent = values.every(
                (v) =>
                  v !== undefined &&
                  v !== null &&
                  !(typeof v === "string" && v === "")
              );
              
              if (!allPresent) {
                // Do not dedupe records missing conflict values; still avoid PK updates on composite keys
                if (!conflictCols.includes("id")) {
                  delete (rec as Record<string, unknown>).id;
                }
                deduped.push(rec);
                console.log("➕ Added record with missing conflict values (no deduplication)");
                continue;
              }
  
              // Normalize strings for dedupe to match DB uniqueness (trim + lowercase)
              const normalized = values.map((v) =>
                typeof v === "string" ? v.trim().toLowerCase() : v
              );
              const key = JSON.stringify(normalized);
              
              if (!seen.has(key)) {
                seen.add(key);
                if (!conflictCols.includes("id")) {
                  delete (rec as Record<string, unknown>).id;
                }
                deduped.push(rec);
                console.log(`➕ Added unique record with key: ${key}`);
              } else {
                duplicateCount++;
                console.log(`⏭️  Skipped duplicate record with key: ${key}`);
              }
            }
            
            console.log(`📊 Deduplication results:`);
            console.log(`   Original records: ${recordsToProcess.length}`);
            console.log(`   After deduplication: ${deduped.length}`);
            console.log(`   Duplicates removed: ${duplicateCount}`);
            
            recordsToProcess = deduped;
          }
          
          console.groupEnd();
        }
  
        // 5. Perform batch upload to Supabase
        uploadResult.totalRows = recordsToProcess.length;
        console.log(`🚀 Starting Supabase upload for ${uploadResult.totalRows} records`);
  
        if (recordsToProcess.length === 0) {
          console.log("⚠️ No records to upload after processing");
          toast.warning("No valid records found to upload after processing.");
          console.groupEnd();
          return uploadResult;
        }
  
        console.group("📤 Supabase Upload Process");
  
        for (let i = 0; i < recordsToProcess.length; i += batchSize) {
          const batch = recordsToProcess.slice(i, i + batchSize);
          const progress = Math.round(
            ((i + batch.length) / recordsToProcess.length) * 100
          );
          toast.info(`Uploading batch ${Math.floor(i / batchSize) + 1}... (${progress}%)`);
          
          console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`);
          console.log(`   Range: ${i} - ${i + batch.length - 1}`);
          console.log(`   Batch size: ${batch.length}`);
          console.log(`   Progress: ${progress}%`);
          console.log("📊 Batch data sample:", batch.slice(0, 2)); // Show first 2 records
  
          // If using composite conflict keys, upsert rows one-by-one to avoid
          // "ON CONFLICT DO UPDATE command cannot affect row a second time"
          const isCompositeConflict =
            uploadType === "upsert" &&
            conflictColumn &&
            String(conflictColumn).split(",").length > 1;
            
          if (isCompositeConflict) {
            console.log("🔄 Using individual upserts for composite conflict keys");
            
            for (let j = 0; j < batch.length; j++) {
              const row = batch[j];
              console.log(`📝 Upserting individual record ${i + j + 1}:`, row);
              
              try {
                const { error } = await upsertOne(row as TableInsert<T>, conflictColumn as string);
                  
                if (error) {
                  console.error(`❌ Individual upsert failed for record ${i + j + 1}:`, error);
                  uploadResult.errorCount += 1;
                  uploadResult.errors.push({
                    rowIndex: i + j,
                    data: row as Record<string, unknown>,
                    error: error.message,
                  });
                  if (showToasts) {
                    toast.error(
                      `Error at record ${i + j + 1}: ${error.message}`
                    );
                  }
                } else {
                  console.log(`✅ Individual upsert successful for record ${i + j + 1}`);
                  uploadResult.successCount += 1;
                }
              } catch (unexpectedError) {
                const errorMsg = unexpectedError instanceof Error 
                  ? unexpectedError.message 
                  : "Unexpected error during individual upsert";
                console.error(`💥 Unexpected error during individual upsert:`, unexpectedError);
                uploadResult.errorCount += 1;
                uploadResult.errors.push({
                  rowIndex: i + j,
                  data: row as Record<string, unknown>,
                  error: errorMsg,
                });
              }
            }
            continue;
          }
  
          // Regular batch processing
          console.log(`🚀 Executing batch ${uploadType} operation`);
          
          try {
            let query;
            if (uploadType === "insert") {
              console.log("➕ Using INSERT operation");
              query = insertBatch(batch as TableInsert<T>[]);
            } else {
              console.log(`🔄 Using UPSERT operation with conflict: ${conflictColumn}`);
              query = upsertBatch(batch as TableInsert<T>[], conflictColumn as string);
            }
  
            const { error } = await query;
            
            if (error) {
              // Handle foreign key constraint violation specifically
              if (error.code === '23503' && error.message.includes('ofc_cables_sn_id_fkey')) {
                // Type-safe access to sn_id
                type RecordWithSnId = { sn_id?: unknown };
                const getSnId = (record: unknown): string | undefined => {
                  if (record && typeof record === 'object' && 'sn_id' in record) {
                    const value = (record as RecordWithSnId).sn_id;
                    return value !== null && value !== undefined ? String(value) : undefined;
                  }
                  return undefined;
                };
                
                // Extract all unique sn_ids from the batch that caused the error
                const invalidSnIds = [...new Set(
                  batch.map(record => getSnId(record)).filter((id): id is string => Boolean(id))
                )];
                
                // Log detailed error information
                console.error('Foreign key violation details:', {
                  table: tableName,
                  constraint: 'ofc_cables_sn_id_fkey',
                  invalidValues: invalidSnIds,
                  error: error.message
                });
                
                // Add validation errors for each affected row
                batch.forEach((record, index) => {
                  const snId = getSnId(record);
                  if (snId) {
                    uploadResult.validationErrors.push({
                      rowIndex: i + index,
                      column: 'sn_id',
                      value: snId,
                      error: `Foreign key violation: sn_id '${snId}' does not exist in the nodes table`,
                      data: { column: 'sn_id', value: snId, constraint: 'ofc_cables_sn_id_fkey' }
                    });
                  }
                });
                
                // Add a summary error to the upload result
                const errorMessage = `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found in batch. ` +
                  `Invalid values: ${invalidSnIds.join(', ')}`;
                uploadResult.errorCount += batch.length;
                uploadResult.errors.push({
                  rowIndex: i,
                  data: batch,
                  error: errorMessage
                });
                
                // Show user-friendly error message
                if (showToasts) {
                  toast.error(
                    `Foreign key violation: ${invalidSnIds.length} invalid sn_id value(s) found. ` +
                    'Check the console for details.',
                    { duration: 10000 }
                  );
                }
              } else {
                // Handle other types of errors
                const errorDetails: Record<string, unknown> = {};
                if (error.code === '23503') {
                  errorDetails.constraint = error.message.match(/constraint "(.*?)"/)?.[1];
                  errorDetails.detail = error.message;
                }
                
                uploadResult.errorCount += batch.length;
                uploadResult.errors.push({
                  rowIndex: i,
                  data: batch,
                  error: error.message,
                  ...(Object.keys(errorDetails).length > 0 ? { details: errorDetails } : {})
                });
                
                if (showToasts) {
                  toast.error(`Error in batch starting at record ${i + 1}: ${error.message}`);
                }
              }
            } else {
              console.log(`✅ Batch operation successful for ${batch.length} records`);
              uploadResult.successCount += batch.length;
            }
          } catch (unexpectedError) {
            const errorMsg = unexpectedError instanceof Error 
              ? unexpectedError.message 
              : "Unexpected error during batch operation";
            console.error(`💥 Unexpected error during batch operation:`, unexpectedError);
            uploadResult.errorCount += batch.length;
            uploadResult.errors.push({
              rowIndex: i,
              data: batch,
              error: errorMsg,
            });
          }
        }
        
        console.groupEnd(); // End Supabase Upload Process
  
        // 6. Finalize and report
        console.group("📊 Upload Results Summary");
        console.log(`✅ Successful uploads: ${uploadResult.successCount}`);
        console.log(`❌ Failed uploads: ${uploadResult.errorCount}`);
        console.log(`⏭️  Skipped rows: ${uploadResult.skippedRows}`);
        console.log(`📝 Total processing logs: ${processingLogs.length}`);
        console.log(`⚠️  Total validation errors: ${allValidationErrors.length}`);
        
        if (uploadResult.errors.length > 0) {
          console.log("🔍 Upload errors:", uploadResult.errors);
        }
        
        if (allValidationErrors.length > 0) {
          console.log("🔍 Validation errors:", allValidationErrors);
        }
        console.groupEnd();
  
        if (uploadResult.errorCount > 0) {
          if (showToasts) {
            toast.warning(
              `${uploadResult.successCount} rows uploaded successfully, but ${uploadResult.errorCount} failed. Check console for details.`
            );
          }
        } else {
          if (showToasts) {
            toast.success(
              `Successfully uploaded ${uploadResult.successCount} of ${uploadResult.totalRows} records.`
            );
          }
          
          // Invalidate related queries instead of reloading the page to preserve UI state
          try {
            await queryClient.invalidateQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown[];
                if (!Array.isArray(key)) return false;
                // Match if any segment equals the tableName or contains it as a substring (to catch views/RPC keys like "v_ofc_cables_complete")
                return key.some((seg) => {
                  if (seg === tableName) return true;
                  if (typeof seg === "string" && seg.toLowerCase().includes(String(tableName).toLowerCase())) return true;
                  return false;
                });
              },
            });
            // Force refetch so UI reflects changes immediately even if staleTime is large
            await queryClient.refetchQueries({
              predicate: (q) => {
                const key = q.queryKey as unknown[];
                if (!Array.isArray(key)) return false;
                return key.some((seg) => {
                  if (seg === tableName) return true;
                  if (typeof seg === "string" && seg.toLowerCase().includes(String(tableName).toLowerCase())) return true;
                  return false;
                });
              },
              type: "active",
            });
            console.log("✅ Query cache invalidated successfully");
          } catch (err) {
            console.warn("⚠️ Failed to invalidate queries after upload", err);
          }
        }
  
        console.groupEnd(); // End Excel Upload Process
        return uploadResult;
      },
      ...mutationOptions,
    });
  }
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useRoleFunctions.ts -->
```typescript
// hooks/database/functions.ts - Hooks for Supabase functions
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import React from 'react'
import { useAuth } from '@/hooks/useAuth'

// Types for better type safety
type UserRole = string | null
type SuperAdminStatus = boolean | null

interface UserPermissions {
  role: UserRole
  isSuperAdmin: SuperAdminStatus
  isLoading: boolean
  error: Error | null
  isError: boolean
  refetch: () => void
}

/**
 * Hook to get the current user's role with automatic session refresh if needed
 */
export const useMyRole = (): UseQueryResult<UserRole, Error> => {
  const supabase = createClient()
  const { user, authState, syncSession } = useAuth()
  
  return useQuery({
    queryKey: ['my-role', user?.id],
    queryFn: async (): Promise<UserRole> => {
      try {
        const { data, error } = await supabase.rpc('get_my_role')

        // If we get null data, try refreshing the session and retry
        if (data === null) {
          const sessionRefreshed = await syncSession()
          if (sessionRefreshed) {
            const { data: retryData, error: retryError } = await supabase.rpc('get_my_role')
            if (retryError) throw retryError
            return retryData as UserRole
          }
        }

        if (error) {
          console.error('Role fetch error:', error)
          throw new Error(`Failed to get user role: ${error.message}`)
        }
        
        return data as UserRole
      } catch (err) {
        console.error('Role query error:', err)
        throw err
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('JWT') || error.message.includes('auth')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: authState === "authenticated" && !!user?.id,
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst'
  })
}

/**
 * Hook to check if the current user is a super admin
 */
export const useIsSuperAdmin = (): UseQueryResult<SuperAdminStatus, Error> => {
  const supabase = createClient()
  const { user, authState, syncSession } = useAuth()
  
  return useQuery({
    queryKey: ['is-super-admin', user?.id],
    queryFn: async (): Promise<SuperAdminStatus> => {
      try {
        const { data, error } = await supabase.rpc('is_super_admin')

        // If we get null data, try refreshing the session and retry
        if (data === null) {
          const sessionRefreshed = await syncSession()
          if (sessionRefreshed) {
            const { data: retryData, error: retryError } = await supabase.rpc('is_super_admin')
            if (retryError) throw retryError
            return retryData as SuperAdminStatus
          }
        }
        
        if (error) {
          console.error('Super admin check error:', error)
          throw new Error(`Failed to check super admin status: ${error.message}`)
        }
        
        return data as SuperAdminStatus
      } catch (err) {
        console.error('Super admin query error:', err)
        throw err
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('JWT') || error.message.includes('auth')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: authState === "authenticated" && !!user?.id,
    refetchOnWindowFocus: false,
    networkMode: 'offlineFirst'
  })
}

/**
 * Combined hook that returns both role and super admin status
 * with optimized refetching and error handling
 */
export const useUserPermissions = (): UserPermissions => {
  const roleQuery = useMyRole()
  const superAdminQuery = useIsSuperAdmin()
  
  const refetch = React.useCallback(() => {
    return Promise.allSettled([
      roleQuery.refetch(),
      superAdminQuery.refetch()
    ])
  }, [roleQuery, superAdminQuery])
  
  return {
    role: roleQuery.data ?? null,
    isSuperAdmin: superAdminQuery.data ?? null,
    isLoading: roleQuery.isLoading || superAdminQuery.isLoading,
    error: roleQuery.error || superAdminQuery.error || null,
    isError: roleQuery.isError || superAdminQuery.isError,
    refetch
  }
}

/**
 * Extended version of user permissions with utility methods
 */
export const useUserPermissionsExtended = () => {
  const permissions = useUserPermissions()
  
  const hasRole = React.useCallback((requiredRole: string): boolean => {
    return permissions.role === requiredRole
  }, [permissions.role])
  
  const hasAnyRole = React.useCallback((requiredRoles: string[]): boolean => {
    return permissions.role ? requiredRoles.includes(permissions.role) : false
  }, [permissions.role])
  
  const canAccess = React.useCallback((allowedRoles?: string[]): boolean => {
    // Super admin can access everything
    if (permissions.isSuperAdmin) return true
    
    // If no roles specified, just check if authenticated
    if (!allowedRoles || allowedRoles.length === 0) return !!permissions.role
    
    // Check if user has required role
    return hasAnyRole(allowedRoles)
  }, [permissions.isSuperAdmin, permissions.role, hasAnyRole])
  
  return {
    ...permissions,
    hasRole,
    hasAnyRole,
    canAccess,
    isReady: !permissions.isLoading && !permissions.error
  }
}

/**
 * Optimized hook for role-based conditional rendering
 * Uses memoization to prevent unnecessary re-renders
 */
export const useHasPermission = (allowedRoles?: string[]): boolean => {
  const { canAccess } = useUserPermissionsExtended()
  return React.useMemo(() => canAccess(allowedRoles), [canAccess, allowedRoles])
}

// Export types for use in other files
export type { UserRole, SuperAdminStatus, UserPermissions }
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useCrudPage.ts -->
```typescript
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/utils/supabase/client";
import {
  useTableWithRelations,
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  Filters,
  TableName,
  Row,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
} from "@/hooks/database";
import { toast } from "sonner";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { DEFAULTS } from "@/config/constants";

// A generic type to ensure records passed to actions have an 'id' and optionally a 'name'
type RecordWithId = {
  id: string | number;
  system_id?: string | number;
  system_connection_id?: string | number;
  name?: string;
  [key: string]: unknown;
};

/**
 * A comprehensive hook to manage the state and logic for a standard CRUD page.
 * @param tableName The name of the Supabase table.
 * @param options Configuration options for the hook.
 */
export function useCrudPage<T extends TableName>({
  tableName,
  relations = [],
  searchColumn = "name",
  orderByColumn = "name",
}: {
  tableName: T;
  relations?: string[];
  searchColumn: (keyof Row<T> & string) | "name";
  orderByColumn?: string;
}) {
  const supabase = createClient();

  // --- STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Row<T> | null>(null);
  const [debouncedSearch] = useDebounce(searchQuery, DEFAULTS.DEBOUNCE_DELAY);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // --- FILTERS ---
  const serverFilters = useMemo(() => {
    const combinedFilters: Filters = { ...filters };
    if (debouncedSearch) {
      combinedFilters[searchColumn] = {
        operator: "ilike",
        value: `%${debouncedSearch}%`,
      };
    }
    return combinedFilters;
  }, [filters, debouncedSearch, searchColumn]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // --- DATA FETCHING ---
  const { data, isLoading, error, refetch } = useTableWithRelations(
    supabase,
    tableName,
    relations,
    {
      filters: serverFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      includeCount: true,
      orderBy: [{ column: orderByColumn, ascending: true }],
    }
  );

  const totalCount =
    (data?.[0] as { total_count: number })?.total_count ?? data?.length ?? 0;

  // --- MUTATIONS ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record created successfully!");
      },
      onError: (err) => toast.error(`Creation failed: ${err.message}`),
    }
  );
  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record updated successfully!");
      },
      onError: (err) => toast.error(`Update failed: ${err.message}`),
    }
  );
  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: () => refetch(),
    onError: (err) => toast.error(`Status toggle failed: ${err.message}`),
  });

  // *** INTEGRATE useDeleteManager ***
  const deleteManager = useDeleteManager({ tableName, onSuccess: refetch });

  // NEW: Bulk mutation hooks
  const { bulkDelete, bulkUpdate } = useTableBulkOperations(
    supabase,
    tableName
  );

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending;

  // --- HANDLERS ---
  const openAddModal = useCallback(() => {
    setEditingRecord(null);
    setIsModalOpen(true);
  }, []);
  const openEditModal = useCallback((record: Row<T>) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRecord(null);
  }, []);

  const handleSave = useCallback(
    (formData: TableInsertWithDates<T>) => {
      // Convert ISO date strings back to Date objects for the database
      const processedData = { ...formData };

      // Handle date fields - adjust these field names as needed
      const dateFields = ['employee_dob', 'employee_doj', 'created_at', 'updated_at'] as const;
      
      dateFields.forEach((field) => {
        const fieldKey = field as keyof typeof processedData;
        if (field in processedData && processedData[fieldKey]) {
          const dateValue = processedData[fieldKey] as string | Date;
          (processedData as TableInsertWithDates<T>)[fieldKey] = new Date(dateValue) as unknown as TableInsertWithDates<T>[typeof fieldKey];
        }
      });

    if (editingRecord && "id" in editingRecord && editingRecord.id) {
      updateItem({
        id: String(editingRecord.id),
        data: processedData as TableUpdate<T>,
      });
    } else {
      insertItem(processedData as TableInsert<T>);
    }
  },
  [editingRecord, insertItem, updateItem]
);

  // The delete handler now just triggers the delete manager
  const handleDelete = useCallback(
    (record: RecordWithId) => {
      deleteManager.deleteSingle({
        id: String(record.id),
        name: record.name || String(record.id),
      });
    },
    [deleteManager]
  );

  const handleToggleStatus = useCallback(
    (record: RecordWithId & { status?: boolean | null }) => {
      toggleStatus({
        id: String(record.id),
        status: !(record.status ?? false),
      });
    },
    [toggleStatus]
  );

  // NEW: Bulk action handlers
  const handleRowSelect = useCallback(
    (rows: Array<Row<T> & { id?: string | number }>) => {
      setSelectedRowIds(
        rows
          .map((r) => r?.id)
          .filter((id): id is string => typeof id === "string")
      );
    },
    []
  );

  const handleClearSelection = useCallback(() => setSelectedRowIds([]), []);

  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedRowIds.length} selected records?`
      )
    ) {
      bulkDelete.mutate(
        { ids: selectedRowIds },
        {
          onSuccess: () => {
            toast.success(`${selectedRowIds.length} records deleted.`);
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) => toast.error(`Bulk delete failed: ${err.message}`),
        }
      );
    }
  }, [selectedRowIds, bulkDelete, refetch]);

  const handleBulkUpdateStatus = useCallback(
    (status: "active" | "inactive") => {
      if (selectedRowIds.length === 0) return;
      const updates = selectedRowIds.map((id) => ({
        id,
        data: { status: status === "active" } as unknown as TableUpdate<T>,
      }));
      bulkUpdate.mutate(
        { updates },
        {
          onSuccess: () => {
            toast.success(`${selectedRowIds.length} records updated.`);
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) =>
            toast.error(`Bulk status update failed: ${err.message}`),
        }
      );
    },
    [selectedRowIds, bulkUpdate, refetch]
  );

  // --- RETURN VALUE ---
  return {
    // Data and state
    data: data || [],
    totalCount,
    isLoading,
    error,
    isMutating,
    refetch,

    // UI State
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    modal: {
      isModalOpen,
      editingRecord,
      openAddModal,
      openEditModal,
      closeModal,
    },

    // Actions
    actions: { handleSave, handleDelete, handleToggleStatus },

    // Bulk Actions
    bulkActions: {
      selectedCount: selectedRowIds.length,
      handleBulkDelete,
      handleBulkUpdateStatus,
      handleClearSelection,
      handleRowSelect,
    },

    // Expose delete modal state and handlers directly
    deleteModal: {
      isOpen: deleteManager.isConfirmModalOpen,
      message: deleteManager.confirmationMessage,
      confirm: deleteManager.handleConfirm,
      cancel: deleteManager.handleCancel,
      isLoading: deleteManager.isPending,
    },
  };
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useDeleteManager.ts -->
```typescript
// hooks/useDeleteManager.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTableDelete } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase-types';
import { hasDetails } from '@/types/error-types';

interface DeleteItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface BulkDeleteFilter {
  column: string;
  value: unknown;
  displayName: string;
}

interface UseDeleteManagerProps {
  tableName: keyof Database['public']['Tables'];
  onSuccess?: () => void;
}

export function useDeleteManager({ tableName, onSuccess }: UseDeleteManagerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    type: 'single' | 'bulk';
    items?: DeleteItem[];
    filter?: BulkDeleteFilter;
  } | null>(null);

  const supabase = createClient();
  const { mutate: deleteRowsById, isPending } = useTableDelete(supabase, tableName);

  
  
  // Single item deletion
  const deleteSingle = useCallback((item: DeleteItem) => {
    setDeleteConfig({
      type: 'single',
      items: [item],
    });
    setIsConfirmModalOpen(true);
  }, []);

  // Multiple items deletion (by IDs)
  const deleteMultiple = useCallback((items: DeleteItem[]) => {
    setDeleteConfig({
      type: 'single', // Still uses ID-based deletion
      items,
    });
    setIsConfirmModalOpen(true);
  }, []);

  // Bulk deletion by filter
  const deleteBulk = useCallback((filter: BulkDeleteFilter) => {
    setDeleteConfig({
      type: 'bulk',
      filter,
    });
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!deleteConfig) return;

    setIsConfirmModalOpen(false);

    try {
      if (deleteConfig.type === 'single' && deleteConfig.items) {
        // Direct ID-based deletion
        const idsToDelete = deleteConfig.items.map(item => item.id);
        
        deleteRowsById(idsToDelete, {
          onSuccess: () => {
            const itemNames = deleteConfig.items!.map(item => item.name).join(', ');
            toast.success(
              deleteConfig.items!.length === 1
                ? `Successfully deleted "${itemNames}"`
                : `Successfully deleted ${deleteConfig.items!.length} items: ${itemNames}`
            );
            onSuccess?.();
          },
          onError: (err) => {
            console.error('Deletion failed:', err);
            if (hasDetails(err)) {
              toast.error('Failed to delete items'+ err.details);
            } else {
              toast.error('Failed to delete items');
            }
          },
        });
      } else if (deleteConfig.type === 'bulk' && deleteConfig.filter) {
        // First fetch IDs that match the filter, then delete
        const { data: rowsToDelete, error: fetchError } = await supabase
          .from(tableName)
          .select('id')
          .eq(deleteConfig.filter.column, deleteConfig.filter.value);

        if (fetchError) {
          throw fetchError;
        }

        if (!rowsToDelete || rowsToDelete.length === 0) {
          toast.error(`No items found matching "${deleteConfig.filter.displayName}" to delete.`);
          return;
        }

        const idsToDelete = rowsToDelete.map(row => row.id);
        
        deleteRowsById(idsToDelete, {
          onSuccess: () => {
            toast.success(
              `Successfully deleted ${idsToDelete.length} items from "${deleteConfig.filter!.displayName}"`
            );
            onSuccess?.();
          },
          onError: (err) => {
            console.error('Deletion failed:', err);
            if (hasDetails(err)) {
              toast.error('Failed to delete items'+ err.details);
            } else {
              toast.error('Failed to delete items');
            }
          },
        });
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      toast.error('Failed to delete items');
    } finally {
      setDeleteConfig(null);
    }
  }, [deleteConfig, deleteRowsById, onSuccess, supabase, tableName]);

  const handleCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
    setDeleteConfig(null);
  }, []);

  // Generate confirmation message
  const getConfirmationMessage = useCallback(() => {
    if (!deleteConfig) return '';

    if (deleteConfig.type === 'single' && deleteConfig.items) {
      const items = deleteConfig.items;
      if (items.length === 1) {
        return `Are you sure you want to delete "${items[0].name}"? This cannot be undone.`;
      }
      return `Are you sure you want to delete ${items.length} items? This cannot be undone.`;
    }

    if (deleteConfig.type === 'bulk' && deleteConfig.filter) {
      return `Are you sure you want to delete all items in "${deleteConfig.filter.displayName}"? This cannot be undone.`;
    }

    return 'Are you sure you want to delete? This cannot be undone.';
  }, [deleteConfig]);

  return {
    // Actions
    deleteSingle,
    deleteMultiple,
    deleteBulk,
    handleConfirm,
    handleCancel,
    
    // State
    isConfirmModalOpen,
    isPending,
    confirmationMessage: getConfirmationMessage(),
    
    // For debugging/display
    deleteConfig,
  };
}


```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useIsMobile.tsx -->
```typescript
// hooks/useIsMobile.tsx
import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth < breakpoint;
      
      // Check user agent for mobile indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'mobile', 'android', 'iphone', 'ipad', 'ipod', 
        'blackberry', 'windows phone', 'opera mini'
      ];
      const isMobileAgent = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );
      
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Combine all checks - prioritize screen size but consider other factors
      const mobile = isSmallScreen || (isMobileAgent && hasTouch);
      
      setIsMobile(mobile);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    // Listen for orientation changes (mobile specific)
    window.addEventListener('orientationchange', checkDevice);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;

// Usage examples:
// const isMobile = useIsMobile(); // Uses default 768px breakpoint
// const isMobile = useIsMobile(1024); // Custom breakpoint
// const isMobile = useIsMobile(480); // Smaller breakpoint for strict mobile-only
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/defaultUploadConfigs.ts -->
```typescript
import { TableNames } from "@/config/helper-types";
import { buildUploadConfig, TABLES } from "@/config/table-column-keys";

// Thin adapter: build per-table upload config from SSOT
const defaultUploadConfigs = () => {
  const result: Partial<
    Record<TableNames, ReturnType<typeof buildUploadConfig<TableNames>>>
  > = {};

  (Object.keys(TABLES) as TableNames[]).forEach((tableName) => {
    result[tableName] = buildUploadConfig(tableName);
  });

  return result as Record<
    TableNames,
    ReturnType<typeof buildUploadConfig<TableNames>>
  >;
};

export default defaultUploadConfigs;

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useBulkSelection.ts -->
```typescript
import { useState, useCallback } from 'react';

interface UseSelectionReturn<T> {
  selectedItems: Set<T>;
  selectedCount: number;
  toggleSelection: (id: T) => void;
  toggleAllSelection: (allIds: T[]) => void;
  setSelectedItems: (ids: T[]) => void;
  clearSelection: () => void;
  isSelected: (id: T) => boolean;
  isAllSelected: (allIds: T[]) => boolean;
  isIndeterminate: (allIds: T[]) => boolean;
}

export function useSelection<T = string>(): UseSelectionReturn<T> {
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set());

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Toggle single item selection
  const toggleSelection = useCallback((id: T) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Set selected items
  const setSelected = useCallback((ids: T[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  // Toggle all items selection
  const toggleAllSelection = useCallback((allIds: T[]) => {
    setSelectedItems(prev => {
      if (prev.size === allIds.length && allIds.length > 0) {
        return new Set(); // Clear all if all are selected
      } else {
        return new Set(allIds); // Select all
      }
    });
  }, []);

  // Check if item is selected
  const isSelected = useCallback((id: T) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  // Check if all items are selected
  const isAllSelected = useCallback((allIds: T[]) => {
    return allIds.length > 0 && selectedItems.size === allIds.length;
  }, [selectedItems]);

  // Check if selection is indeterminate (some but not all selected)
  const isIndeterminate = useCallback((allIds: T[]) => {
    return selectedItems.size > 0 && selectedItems.size < allIds.length;
  }, [selectedItems]);

  return {
    selectedItems,
    selectedCount: selectedItems.size,
    toggleSelection,
    toggleAllSelection,
    setSelectedItems: setSelected,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useCrudManager.ts -->
```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/utils/supabase/client";
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  Filters,
  TableName,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
} from "@/hooks/database";
import { toast } from "sonner";
import { useDeleteManager } from "./useDeleteManager";

// --- TYPE DEFINITIONS for the Hook's Interface ---
export type RecordWithId = {
  id: string | number | null;
  system_id?: string | number | null;
  system_connection_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  [key: string]: unknown;
};

export interface DataQueryHookParams {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  filters: Filters;
}

export interface DataQueryHookReturn<V> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;

type BaseRecord = { id: string | null; [key: string]: unknown };

export interface CrudManagerOptions<T extends TableName, V extends BaseRecord> {
  tableName: T;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: keyof V & string;
}

// --- THE HOOK ---
export function useCrudManager<T extends TableName, V extends BaseRecord>({
  tableName,
  dataQueryHook,
}: CrudManagerOptions<T, V>) {
  const supabase = createClient();

  // --- STATE MANAGEMENT ---
  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // --- DATA FETCHING ---
  const { data, totalCount, activeCount, inactiveCount, isLoading, error, refetch } = dataQueryHook({
    currentPage,
    pageLimit,
    searchQuery: debouncedSearch,
    filters,
  });

  // --- MUTATIONS ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record created successfully.");
      },
      onError: (error) => {
        toast.error(`Failed to create record: ${error.message}`);
      },
    }
  );

  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record updated successfully.");
      },
      onError: (error) => {
        toast.error(`Failed to update record: ${error.message}`);
      },
    }
  );

  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: () => {
      refetch();
      toast.success("Status updated successfully.");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Initialize delete manager
  const deleteManager = useDeleteManager({ 
    tableName, 
    onSuccess: () => {
      refetch();
      handleClearSelection(); // Clear selection after successful delete
    }
  });

  const { bulkUpdate } = useTableBulkOperations(supabase, tableName);

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkUpdate.isPending;

  // --- MODAL HANDLERS ---
  const openAddModal = useCallback(() => {
    setEditingRecord(null);
    setIsEditModalOpen(true);
  }, []);

  const openEditModal = useCallback((record: V) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  }, []);

  const openViewModal = useCallback((record: V) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
    setIsViewModalOpen(false);
    setViewingRecord(null);
  }, []);

  // --- SAVE HANDLER ---
  const handleSave = useCallback(
    (formData: TableInsertWithDates<T>) => {
      // Convert ISO date strings back to Date objects for the database
      const processedData = { ...formData };

      // Handle date fields - adjust these field names as needed
      const dateFields = [
        "employee_dob",
        "employee_doj", 
        "created_at",
        "updated_at",
      ] as const;

      dateFields.forEach((field) => {
        const fieldKey = field as keyof typeof processedData;
        if (field in processedData && processedData[fieldKey]) {
          const dateValue = processedData[fieldKey] as string | Date;
          (processedData as TableInsertWithDates<T>)[fieldKey] = new Date(
            dateValue
          ) as unknown as TableInsertWithDates<T>[typeof fieldKey];
        }
      });

      if (editingRecord && "id" in editingRecord && editingRecord.id) {
        updateItem({
          id: String(editingRecord.id),
          data: processedData as TableUpdate<T>,
        });
      } else {
        insertItem(processedData as TableInsert<T>);
      }
    },
    [editingRecord, insertItem, updateItem]
  );

  // --- DELETE HANDLERS ---
  const handleDelete = useCallback(
    (record: RecordWithId) => {
      if (!record.id) {
        toast.error("Cannot delete record: Invalid ID");
        return;
      }

      const displayName = getDisplayName(record);
      deleteManager.deleteSingle({
        id: String(record.id),
        name: displayName,
      });
    },
    [deleteManager]
  );

  // --- UTILITY TO GET DISPLAY NAME ---
  const getDisplayName = useCallback((record: RecordWithId): string => {
    if (record.name) return String(record.name);
    if (record.first_name && record.last_name) {
      return `${record.first_name} ${record.last_name}`;
    }
    if (record.first_name) return String(record.first_name);
    return String(record.id) || 'Unknown';
  }, []);

  // --- STATUS TOGGLE HANDLER ---
  const handleToggleStatus = useCallback(
    (record: RecordWithId & { status?: boolean | null }) => {
      if (!record.id) {
        toast.error("Cannot update status: Invalid record ID");
        return;
      }

      toggleStatus({
        id: String(record.id),
        status: !(record.status ?? false),
      });
    },
    [toggleStatus]
  );

  // --- BULK SELECTION HANDLERS ---
  const handleRowSelect = useCallback(
    (rows: Array<V & { id?: string | number }>) => {
      const validIds = rows
        .map((r) => r.id)
        .filter((id): id is NonNullable<typeof id> => id != null)
        .map((id) => String(id));
      setSelectedRowIds(validIds);
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRowIds([]);
  }, []);

  // --- BULK DELETE HANDLER ---
  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) {
      toast.error("No records selected for deletion");
      return;
    }

    // Convert selected IDs back to records for display names
    const selectedRecords = data
      .filter((record) => selectedRowIds.includes(String(record.id)))
      .map((record) => ({
        id: String(record.id),
        name: getDisplayName(record as RecordWithId),
      }));

    deleteManager.deleteMultiple(selectedRecords);
  }, [selectedRowIds, data, deleteManager, getDisplayName]);

  // --- BULK STATUS UPDATE HANDLER ---
  const handleBulkUpdateStatus = useCallback(
    (status: "active" | "inactive") => {
      if (selectedRowIds.length === 0) return;
      const updates = selectedRowIds.map((id) => ({
        id,
        data: { status: status === "active" } as unknown as TableUpdate<T>,
      }));

      bulkUpdate.mutate(
        { updates },
        {
          onSuccess: () => {
            toast.success(
              `Successfully updated ${updates.length} records to ${status}`
            );
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) => {
            toast.error(`Failed to update status: ${err.message}`);
          },
        }
      );
    },
    [selectedRowIds, bulkUpdate, refetch]
  );

  // --- BULK DELETE BY FILTER ---
  const handleBulkDeleteByFilter = useCallback(
    (column: string, value: unknown, displayName: string) => {
      deleteManager.deleteBulk({
        column,
        value,
        displayName,
      });
    },
    [deleteManager]
  );

  // --- RETURN VALUE ---
  return {
    // Data
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    isMutating,
    refetch,

    // Pagination
    pagination: { 
      currentPage, 
      pageLimit, 
      setCurrentPage, 
      setPageLimit 
    },

    // Search & Filters  
    search: { 
      searchQuery, 
      setSearchQuery 
    },
    filters: { 
      filters, 
      setFilters 
    },

    // Modals
    editModal: { 
      isOpen: isEditModalOpen, 
      record: editingRecord, 
      openAdd: openAddModal, 
      openEdit: openEditModal, 
      close: closeModal 
    },
    viewModal: { 
      isOpen: isViewModalOpen, 
      record: viewingRecord, 
      open: openViewModal, 
      close: closeModal 
    },

    // Actions
    actions: { 
      handleSave, 
      handleDelete, 
      handleToggleStatus 
    },

    // Bulk Actions
    bulkActions: { 
      selectedRowIds, 
      selectedCount: selectedRowIds.length, 
      handleBulkDelete, 
      handleBulkDeleteByFilter,
      handleBulkUpdateStatus, 
      handleClearSelection, 
      handleRowSelect 
    },

    // Delete Modal (for ConfirmModal component)
    deleteModal: { 
      isOpen: deleteManager.isConfirmModalOpen, 
      message: deleteManager.confirmationMessage, 
      onConfirm: deleteManager.handleConfirm, 
      onCancel: deleteManager.handleCancel, 
      loading: deleteManager.isPending 
    },

    // Utility functions
    utils: {
      getDisplayName,
    },
  };
}
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useOrderedColumns.ts -->
```typescript
import { useMemo } from 'react';

const useOrderedColumns = <T extends { key: string }>(
  columns: T[],
  desiredOrder: string[]
): T[] => {
  return useMemo(() => {
    const ordered = desiredOrder
      .map(key => columns.find(col => col.key === key))
      .filter((col): col is T => col !== undefined);
    
    const remaining = columns.filter(col => !desiredOrder.includes(col.key));
    
    return [...ordered, ...remaining];
  }, [columns, desiredOrder]);
};

export default useOrderedColumns;
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useSorting.ts -->
```typescript
import { useMemo, useState, useCallback } from 'react';

// Types
export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

export interface SortOptions {
  caseSensitive?: boolean;
  numericSort?: boolean;
  locale?: string;
}

export interface UseSortingProps<T> {
  data: T[];
  defaultSortKey?: keyof T | string;
  defaultDirection?: SortDirection;
  options?: SortOptions;
}

export interface UseSortingReturn<T> {
  sortedData: T[];
  sortConfig: SortConfig<T>;
  setSortConfig: (config: SortConfig<T>) => void;
  handleSort: (key: keyof T | string) => void;
  resetSort: () => void;
  isSorted: boolean;
  getSortDirection: (key: keyof T | string) => SortDirection;
}

// Union type for supported sortable values
type SortableValue = string | number | Date | boolean | null | undefined;

// Helper function to get nested property value
function getNestedValue(obj: Record<string, unknown>, path: string): SortableValue {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  // Type guard to ensure we return only sortable values
  if (
    typeof current === 'string' ||
    typeof current === 'number' ||
    typeof current === 'boolean' ||
    current instanceof Date ||
    current === null ||
    current === undefined
  ) {
    return current as SortableValue;
  }
  
  // Convert other types to string for comparison
  return String(current);
}

// Helper function to compare values
function compareValues(
  a: SortableValue, 
  b: SortableValue, 
  direction: SortDirection, 
  options: SortOptions = {}
): number {
  const { caseSensitive = false, numericSort = true, locale = 'en' } = options;
  
  // Handle null/undefined values
  if (a == null && b == null) return 0;
  if (a == null) return direction === 'asc' ? -1 : 1;
  if (b == null) return direction === 'asc' ? 1 : -1;

  // Handle different data types
  if (typeof a === 'string' && typeof b === 'string') {
    const valueA = caseSensitive ? a : a.toLowerCase();
    const valueB = caseSensitive ? b : b.toLowerCase();
    
    // Use localeCompare for proper string sorting
    const result = valueA.localeCompare(valueB, locale, {
      numeric: numericSort,
      sensitivity: caseSensitive ? 'case' : 'base'
    });
    
    return direction === 'asc' ? result : -result;
  }

  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    const result = a - b;
    return direction === 'asc' ? result : -result;
  }

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    const result = a.getTime() - b.getTime();
    return direction === 'asc' ? result : -result;
  }

  // Handle boolean values
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    const result = Number(a) - Number(b);
    return direction === 'asc' ? result : -result;
  }

  // Fallback to string comparison for mixed types
  const stringA = String(a);
  const stringB = String(b);
  const result = stringA.localeCompare(stringB, locale, {
    numeric: numericSort,
    sensitivity: caseSensitive ? 'case' : 'base'
  });
  
  return direction === 'asc' ? result : -result;
}

// Main sorting hook
export function useSorting<T extends Record<string, unknown>>({
  data,
  defaultSortKey,
  defaultDirection = 'asc',
  options = {}
}: UseSortingProps<T>): UseSortingReturn<T> {
  
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: defaultSortKey || '',
    direction: defaultSortKey ? defaultDirection : null
  });

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || !data.length) {
      return data;
    }

    return [...data].sort((a, b) => {
      const valueA = getNestedValue(a, String(sortConfig.key));
      const valueB = getNestedValue(b, String(sortConfig.key));
      
      return compareValues(valueA, valueB, sortConfig.direction, options);
    });
  }, [data, sortConfig, options]);

  // Handle sort column click
  const handleSort = useCallback((key: keyof T | string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Cycle through: asc -> desc -> null -> asc
        switch (prevConfig.direction) {
          case 'asc':
            return { key, direction: 'desc' };
          case 'desc':
            return { key: '', direction: null };
          default:
            return { key, direction: 'asc' };
        }
      } else {
        // New column, start with ascending
        return { key, direction: 'asc' };
      }
    });
  }, []);

  // Reset sorting
  const resetSort = useCallback(() => {
    setSortConfig({ key: '', direction: null });
  }, []);

  // Check if currently sorted
  const isSorted = Boolean(sortConfig.key && sortConfig.direction);

  // Get sort direction for a specific key
  const getSortDirection = useCallback((key: keyof T | string): SortDirection => {
    return sortConfig.key === key ? sortConfig.direction : null;
  }, [sortConfig]);

  return {
    sortedData,
    sortConfig,
    setSortConfig,
    handleSort,
    resetSort,
    isSorted,
    getSortDirection
  };
}

// Additional utility hooks for specific use cases

// Hook for multi-column sorting
export interface MultiSortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
  priority: number;
}

export function useMultiSorting<T extends Record<string, unknown>>(
  data: T[], 
  options: SortOptions = {}
) {
  const [sortConfigs, setSortConfigs] = useState<MultiSortConfig<T>[]>([]);

  const sortedData = useMemo(() => {
    if (!sortConfigs.length || !data.length) return data;

    return [...data].sort((a, b) => {
      for (const config of sortConfigs.sort((x, y) => x.priority - y.priority)) {
        if (!config.direction) continue;
        
        const valueA = getNestedValue(a, String(config.key));
        const valueB = getNestedValue(b, String(config.key));
        
        const result = compareValues(valueA, valueB, config.direction, options);
        if (result !== 0) return result;
      }
      return 0;
    });
  }, [data, sortConfigs, options]);

  const addSort = useCallback((key: keyof T | string, direction: SortDirection) => {
    if (!direction) return;
    
    setSortConfigs(prev => {
      const existing = prev.find(config => config.key === key);
      if (existing) {
        return prev.map(config => 
          config.key === key 
            ? { ...config, direction }
            : config
        );
      }
      return [...prev, { key, direction, priority: prev.length }];
    });
  }, []);

  const removeSort = useCallback((key: keyof T | string) => {
    setSortConfigs(prev => prev.filter(config => config.key !== key));
  }, []);

  const clearSort = useCallback(() => {
    setSortConfigs([]);
  }, []);

  return {
    sortedData,
    sortConfigs,
    addSort,
    removeSort,
    clearSort
  };
}

// Hook for search + sort combination
export function useSearchAndSort<T extends Record<string, unknown>>(
  data: T[],
  searchKeys: (keyof T | string)[],
  sortOptions: SortOptions = {}
) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    return data.filter(item => 
      searchKeys.some(key => {
        const value = getNestedValue(item, String(key));
        return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchKeys]);

  // Apply sorting to filtered data
  const sortingResult = useSorting({
    data: filteredData,
    options: sortOptions
  });

  return {
    ...sortingResult,
    searchTerm,
    setSearchTerm,
    filteredCount: filteredData.length,
    totalCount: data.length
  };
}

// Utility type for extracting sortable keys from an object type
export type SortableKeys<T> = {
  [K in keyof T]: T[K] extends SortableValue ? K : never;
}[keyof T];

// Hook with strongly typed keys (optional, for better type safety)
export function useTypedSorting<T extends Record<string, unknown>>(
  data: T[],
  defaultSortKey?: SortableKeys<T>,
  defaultDirection: SortDirection = 'asc',
  options: SortOptions = {}
) {
  return useSorting({
    data,
    defaultSortKey,
    defaultDirection,
    options
  });
}
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useColumnConfig.tsx -->
```typescript
import { useMemo, ReactNode, useEffect } from 'react';
import { TABLE_COLUMN_KEYS } from '@/config/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { GenericRow, TableOrViewName } from '@/config/helper-types';
// import { inferColumnWidth } from "@/config/column-width";
import {
  inferDynamicColumnWidth,
  inferExcelFormat,
  toTitleCase,
} from '@/config/helper-functions';

/**
 * This is the final, compatible Column Configuration type.
 * It is generic and includes all properties from your `Column<T>` interface.
 */
export interface ColumnConfig<T extends TableOrViewName> {
  /** The unique, type-safe column name. Used as the React key. */
  key: keyof GenericRow<T> & string;
  /** The human-readable title for the column header. */
  title: string;
  /** The key for accessing data from a row object. We set it to be the same as `key`. */
  dataIndex: keyof GenericRow<T> & string;
  /** Optional: The data format for Excel exports. */
  excelFormat?: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'json';
  /** Optional: Flag to hide the column in the UI. */
  hidden?: boolean;
  /** Optional: Column width for UI tables. Use "auto" to fit content width. */
  width?: number | string;
  /** Optional: Allow sorting on this column. */
  sortable?: boolean;
  /** Optional: Allow searching on this column. */
  searchable?: boolean;
  /** Optional: Allow filtering on this column. */
  filterable?: boolean;
  /** Optional: A custom render function for the cell. */
  render?: (value: unknown, record: GenericRow<T>, index: number) => ReactNode;
  // ... and any other properties from your master Column<T> type.
  resizable?: boolean;
}

type ColumnOverrides<T extends TableOrViewName> = {
  // [K in keyof GenericRow<T>]?: Partial<
  //   Omit<Column<GenericRow<T>>, 'key' | 'dataIndex'>
  // >;
  [K in keyof GenericRow<T>]?: Partial<ColumnConfig<T>>;
};

interface UseDynamicColumnConfigOptions<T extends TableOrViewName> {
  overrides?: ColumnOverrides<T>;
  omit?: (keyof GenericRow<T> & string)[];
  data?: GenericRow<T>[];
}

/**
 * A hook that dynamically generates a detailed and type-safe column configuration array
 * that is fully compatible with the application's standard `Column<T>` interface.
 */
// FIX: The hook is now fully generic for tables and views.
export function useDynamicColumnConfig<T extends TableOrViewName>(
  tableName: T,
  options: UseDynamicColumnConfigOptions<T> = {}
): Column<GenericRow<T>>[] {
  const { overrides = {}, omit = [], data = [] } = options;

  const dateColumns = useMemo(
    () =>
      new Set([
        'date_of_birth',
        'last_sign_in_at',
        'created_at',
        'updated_at',
        'auth_updated_at',
        'email_confirmed_at',
        'phone_confirmed_at',
      ]),
    []
  ); // Memoize once

  // generate column widths dynamically
  const columnWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    if (data.length > 0) {
      for (const colName of Object.keys(data[0] || {})) {
        widths[colName] = dateColumns.has(colName)
          ? 120
          : inferDynamicColumnWidth(colName, data);
      }
    }
    return widths;
  }, [data, dateColumns]);

  const columns = useMemo(() => {
    const keysToUse = TABLE_COLUMN_KEYS[tableName] as
      | (keyof GenericRow<T> & string)[]
      | undefined;

    if (!keysToUse) {
      console.warn(`No column keys found for table/view: ${tableName}`);
      return [];
    }

    const omitSet = new Set(omit);

    return (keysToUse as (keyof GenericRow<T> & string)[])
      .filter((key) => !omitSet.has(key))
      .map((key) => {
        const columnOverride =
          (key in overrides ? overrides[key as keyof typeof overrides] : {}) ||
          {};
        // console.log(key + ":" + columnWidths?.[key]);
        const defaultConfig: Column<GenericRow<T>> = {
          title: toTitleCase(key),
          dataIndex: key,
          key: key,
          excelFormat: inferExcelFormat(key),
          width: columnWidths?.[key],
        };

        return { ...defaultConfig, ...columnOverride };
      });
  }, [tableName, overrides, omit, columnWidths]);

  const columnsKeys = columns.map((col) => col.key);

  useEffect(() => {
    console.log(`columns for ${tableName}`, columnsKeys);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return columns;
}

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useDebounce.ts -->
```typescript
// @/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if value changes before delay has passed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useCurrentTableName.ts -->
```typescript
// hooks/useCurrentTableName.ts
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { TableNames } from "@/config/helper-types";

export const useCurrentTableName = (tableName?: TableNames): TableNames | null => {
  const pathname = usePathname();

  return useMemo(() => {
    if (tableName) return tableName;

    const path = pathname || "";
    const segments = path.split("/").filter(Boolean); // Remove empty segments

    // Look for the dashboard segment and get the next segment as the route
    const dashboardIndex = segments.findIndex((segment) => segment === "dashboard");
    if (dashboardIndex === -1 || dashboardIndex >= segments.length - 1) {
      return null;
    }

    const routeSegment = segments[dashboardIndex + 1];

    // Map route segments to table names
    switch (routeSegment) {
      case "users":
        return "user_profiles";
      case "employees":
        return "employees";
      case "categories":
        return "lookup_types";
      case "designations":
        return "employee_designations";
      case "rings":
        return "rings";
      case "maintenance-areas":
        return "maintenance_areas";
      case "lookup":
        return "lookup_types";
      case "ofc":
        // Check if there's a third segment (ID) after ofc
        const hasId = segments.length > dashboardIndex + 2 && segments[dashboardIndex + 2];
        return hasId ? "ofc_connections" : "ofc_cables";
      case "ofc_connections":
        return "ofc_connections";
      case "nodes":
        return "nodes";
      case "systems":
        return "systems";
      case "cpan":
        return "cpan_systems";
      case "cpan_connections":
        return "cpan_connections";
      case "fiber-joints":
        return "fiber_joints";
      case "fiber-joint-connections":
        return "fiber_joint_connections";
      case "logical-fiber-paths":
        return "logical_fiber_paths";
      case "maan":
        return "maan_systems";
      case "maan_connections":
        return "maan_connections";
      case "management-ports":
        return "management_ports";
      case "sdh":
        return "sdh_systems";
      case "sdh_connections":
        return "sdh_connections";
      case "sdh_node_associations":
        return "sdh_node_associations";
      case "system-connections":
        return "system_connections";
      case "user-activity-logs":
        return "user_activity_logs";
      case "vmux":
        return "vmux_systems";
      case "vmux_connections":
        return "vmux_connections";
      default:
        return null;
    }
  }, [tableName, pathname]);
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/UseRouteBasedUploadConfigOptions.tsx -->
```typescript
// src/hooks/useRouteBasedUploadConfig.ts

import { useEffect, FC, ReactNode, useRef } from "react";
// Import the simplified store and its types
import {
  useUploadConfigStore,
  UploadConfig,
} from "@/stores/useUploadConfigStore";
import { useCurrentTableName } from "./useCurrentTableName";
import { TableNames } from "@/config/helper-types";
import { buildUploadConfig } from "@/config/table-column-keys";

export interface UseRouteBasedUploadConfigOptions {
  tableName?: TableNames;
  autoSetConfig?: boolean;
  customConfig?: Partial<UploadConfig<TableNames>>;
}

export const useRouteBasedUploadConfig = (
  options: UseRouteBasedUploadConfigOptions = {}
) => {
  const { tableName, autoSetConfig = true, customConfig } = options;
  const previousTableNameRef = useRef<TableNames | null>(null);

  // Get current table name from the new hook
  const currentTableName = useCurrentTableName(tableName);

  // Get the actions from the store
  const { setUploadConfig, getUploadConfig, clearUploadConfig } =
    useUploadConfigStore();

  // Proper cleanup and config management
  useEffect(() => {
    // Clear previous config when route changes
    if (
      previousTableNameRef.current &&
      previousTableNameRef.current !== currentTableName
    ) {
      clearUploadConfig(previousTableNameRef.current);
    }

    // Set new config if applicable
    if (autoSetConfig && currentTableName) {
      const generated = buildUploadConfig(currentTableName);
      const finalConfig = {
        ...generated,
        ...customConfig,
      } as UploadConfig<TableNames>;
      setUploadConfig(currentTableName, finalConfig);
    }

    // Update the ref with current table name
    previousTableNameRef.current = currentTableName;

    // Cleanup function - runs when component unmounts
    return () => {
      if (currentTableName) {
        clearUploadConfig(currentTableName);
      }
    };
  }, [
    currentTableName,
    autoSetConfig,
    customConfig,
    setUploadConfig,
    clearUploadConfig,
  ]);

  return {
    currentTableName,
    config: currentTableName ? getUploadConfig(currentTableName) : undefined,
  };
};

/**
 * A simple Provider component to easily wrap layouts or pages,
 * activating the route-based configuration logic.
 */
export const RouteBasedUploadConfigProvider: FC<{
  children: ReactNode;
  options?: UseRouteBasedUploadConfigOptions;
}> = ({ children, options = {} }) => {
  useRouteBasedUploadConfig(options);
  return <>{children}</>;
};

```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useAdminUsers.ts -->
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database } from "@/types/supabase-types";
import { UserProfileData } from "@/components/users/user-types";
import { createClient } from "@/utils/supabase/client";

type ErrorType = {
  error: string;
  message: string;
  status?: number;
};

type Json = Record<string, any>;

type UserCreateInput = {
  id: string;  // This will be your custom UUID
  email: string;
  password: string;
  email_confirm?: boolean;
  first_name: string;
  last_name: string;
  role: string;
};

// Types
type AdminGetAllUsers =
  Database["public"]["Functions"]["admin_get_all_users"]["Args"];

type AdminGetAllUsersExtended =
  Database["public"]["Functions"]["admin_get_all_users_extended"]["Args"];

type AdminGetUserByID = Database['public']['Functions']['admin_get_user_by_id']['Args']

type AdminBulkDeleteUsersFunction =
  Database["public"]["Functions"]["admin_bulk_delete_users"]["Args"];

type AdminBulkUpdateUserRole =
  Database["public"]["Functions"]["admin_bulk_update_role"]["Args"];

type AdminBulkUpdateUserStatus =
  Database["public"]["Functions"]["admin_bulk_update_status"]["Args"];

type AdminUpdateUserProfile =
  Database["public"]["Functions"]["admin_update_user_profile"]["Args"];

export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  phone_number: string;
  date_of_birth: string;
  address: Json;
  preferences: Json;
  role: string;
  designation: string;
  status: string;
  is_email_verified: boolean;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
  total_count: number;
}



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
    queryFn: async (): Promise<UserData[]> => {
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
    queryFn: async (): Promise<UserProfileData[]> => {
      const { data, error } = await supabase.rpc("admin_get_all_users_extended", params);

      if (error) {
        throw new Error(error.message);
      }

      return data as UserProfileData[] || [];
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
    queryFn: async (): Promise<UserProfileData | null> => {
      const { data, error } = await supabase.rpc("admin_get_user_by_id", {
        user_id: userId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data?.[0] as UserProfileData || null;
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

      return data?.[0] || null;
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
```

<!-- path: /home/au/Desktop/gitClones/new_hnvtx/hnvtx/hooks/useDebugSession.ts -->
```typescript
// hooks/useDebugSession.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export const useDebugSession = () => {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Check headers that would be sent with requests
      const headers = await supabase.auth.getSession().then(({ data: { session } }) => ({
        'apikey': 'present',
        'authorization': session ? `Bearer ${session.access_token}` : 'none',
        'user_id': session?.user?.id || 'none'
      }))

      setSessionInfo({
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'none',
        refreshToken: session?.refresh_token ? 'present' : 'none',
        expiresAt: session?.expires_at,
        headers,
        error: error?.message
      })

      console.log('Session Debug:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'none',
        headers,
        error: error?.message
      })
    }

    checkSession()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        checkSession()
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return sessionInfo
}
```

