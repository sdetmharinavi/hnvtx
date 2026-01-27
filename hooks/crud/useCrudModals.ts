// hooks/crud/useCrudModals.ts
import { useState, useCallback } from 'react';
import { BaseRecord } from './types';

export interface UseCrudModalsReturn<V extends BaseRecord> {
  editModal: {
    isOpen: boolean;
    record: V | null;
    openAdd: () => void;
    openEdit: (record: V) => void;
    close: () => void;
  };
  viewModal: {
    isOpen: boolean;
    record: V | null;
    open: (record: V) => void;
    close: () => void;
  };
  closeAll: () => void;
}

export function useCrudModals<V extends BaseRecord>(): UseCrudModalsReturn<V> {
  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const openAddModal = useCallback(() => {
    setEditingRecord(null);
    setIsEditModalOpen(true);
  }, []);

  const openEditModal = useCallback((record: V) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  }, []);

  const openViewModal = useCallback((record: V) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  }, []);

  const closeViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingRecord(null);
  }, []);

  const closeAll = useCallback(() => {
    closeEditModal();
    closeViewModal();
  }, [closeEditModal, closeViewModal]);

  return {
    editModal: {
      isOpen: isEditModalOpen,
      record: editingRecord,
      openAdd: openAddModal,
      openEdit: openEditModal,
      close: closeEditModal,
    },
    viewModal: {
      isOpen: isViewModalOpen,
      record: viewingRecord,
      open: openViewModal,
      close: closeViewModal,
    },
    closeAll,
  };
}