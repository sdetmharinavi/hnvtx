// hooks/useNodesPageState.ts
import { useState, useCallback } from 'react';
import { NodeWithRelations } from '@/components/nodes/nodes_types';
import { NodesFilters } from '@/components/nodes/nodes_types';

export const useNodesPageState = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [filters, setFilters] = useState<NodesFilters>({});
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeWithRelations | null>(null);

  const resetPagination = useCallback(() => setCurrentPage(1), []);

  const openCreateForm = useCallback(() => {
    setEditingNode(null);
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((node: NodeWithRelations) => {
    setEditingNode(node);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingNode(null);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<NodesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    resetPagination();
  }, [resetPagination]);

  const updatePagination = useCallback((page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageLimit(pageSize);
  }, []);

  return {
    // State
    searchTerm,
    currentPage,
    pageLimit,
    filters,
    isFormOpen,
    editingNode,
    
    // Actions
    setSearchTerm,
    resetPagination,
    openCreateForm,
    openEditForm,
    closeForm,
    updateFilters,
    updatePagination,
  };
};