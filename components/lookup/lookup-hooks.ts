import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useDeduplicated, useTableDelete, useTableQuery, useToggleStatus } from "@/hooks/database";
import { LookupType } from "@/components/lookup/lookup-types";

export function useLookupTypes(initialCategory = "") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || searchParams.get("category") || "");
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLookup, setEditingLookup] = useState<LookupType | null>(null);

  const supabase = createClient();

  // Database hooks
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useDeduplicated(supabase, "lookup_types", {
    columns: ["category"],
    orderBy: [{ column: "created_at", ascending: true }],
  });

  const {
    data: lookupTypes = [],
    isLoading: lookupLoading,
    error: lookupError,
    refetch: refetchLookups
  } = useTableQuery(supabase, "lookup_types", {
    orderBy: [{ column: "name", ascending: true }],
    filters: {
      name: { operator: "neq", value: "DEFAULT" },
      ...(selectedCategory && { 
        category: { operator: "eq", value: selectedCategory } 
      })
    }
  });

  const { mutate: toggleStatus } = useToggleStatus(supabase, "lookup_types");
  const { mutate: deleteRowsById } = useTableDelete(supabase, "lookup_types");

  // Derived state
  const hasCategories = categories.length > 0;
  const hasSelectedCategory = !!selectedCategory;
  const isLoading = categoriesLoading || lookupLoading;
  
  const filteredLookups = lookupTypes
    .filter(lookup => 
      lookup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lookup.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lookup.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Handlers
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setSearchTerm("");
    router.push(`/dashboard/lookup${category ? `?category=${category}` : ''}`);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchCategories(), refetchLookups()]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to refresh data");
    }
  }, [refetchCategories, refetchLookups]);

  const handleAddNew = useCallback(() => {
    if (!hasSelectedCategory) {
      toast.error("Please select a category first");
      return;
    }
    setEditingLookup(null);
    setIsLookupModalOpen(true);
  }, [hasSelectedCategory]);

  const handleEdit = useCallback((lookup: LookupType) => {
    setEditingLookup(lookup);
    setIsLookupModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteRowsById([id], {
      onSuccess: () => {
        toast.success("Lookup type deleted successfully");
        refetchLookups();
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete lookup type: ${error.message}`);
      }
    });
  }, [deleteRowsById, refetchLookups]);

  const handleToggleStatus = useCallback((id: string, currentStatus: boolean) => {
    toggleStatus({ id, status: !currentStatus }, {
      onSuccess: () => {
        toast.success(`Lookup type ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        refetchLookups();
      },
      onError: (error: Error) => {
        toast.error(`Failed to toggle status: ${error.message}`);
      }
    });
  }, [toggleStatus, refetchLookups]);

  const handleModalClose = useCallback(() => {
    setIsLookupModalOpen(false);
    setEditingLookup(null);
  }, []);

  const handleLookupCreated = useCallback(() => {
    toast.success("Lookup type created successfully");
    refetchLookups();
    handleModalClose();
  }, [refetchLookups, handleModalClose]);

  const handleLookupUpdated = useCallback(() => {
    toast.success("Lookup type updated successfully");
    refetchLookups();
    handleModalClose();
  }, [refetchLookups, handleModalClose]);

  return {
    state: {
      selectedCategory,
      isLookupModalOpen,
      searchTerm,
      editingLookup,
      categories,
      lookupTypes: filteredLookups,
      isLoading,
      hasCategories,
      hasSelectedCategory,
      categoriesError,
      lookupError
    },
    handlers: {
      setSearchTerm,
      handleCategoryChange,
      handleRefresh,
      handleAddNew,
      handleEdit,
      handleDelete,
      handleToggleStatus,
      handleModalClose,
      handleLookupCreated,
      handleLookupUpdated
    }
  };
}