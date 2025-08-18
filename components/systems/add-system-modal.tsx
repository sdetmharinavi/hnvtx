"use client";

import { useState, FC, useEffect } from 'react';
import { FiX, FiServer, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useGetLookupTypesByCategory, useTableQuery, useTableInsert } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { TablesInsert } from '@/types/supabase-types';

interface AddSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSystemModal: FC<AddSystemModalProps> = ({ isOpen, onClose }) => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Form state
  const [systemName, setSystemName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [systemTypeId, setSystemTypeId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [commissionedOn, setCommissionedOn] = useState('');
  const [status, setStatus] = useState(true);
  const [remark, setRemark] = useState('');

  // Fetch data for dropdowns
  const { data: systemTypes = [], isLoading: isLoadingSystemTypes } =
    useGetLookupTypesByCategory(supabase, "SYSTEM_TYPES");
    
  const { data: nodes = [], isLoading: isLoadingNodes } = 
    useTableQuery(supabase, 'nodes', {
        columns: 'id, name',
        orderBy: [{ column: 'name' }]
    });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setSystemName('');
        setSerialNumber('');
        setSystemTypeId('');
        setNodeId('');
        setCommissionedOn('');
        setStatus(true);
        setRemark('');
    }
  }, [isOpen]);

  // Mutation to insert a new system
  const { mutate: addSystem, isPending: isAddingSystem } = useTableInsert(supabase, 'systems', {
    onSuccess: () => {
      toast.success("System added successfully!");
      queryClient.invalidateQueries({ queryKey: ['v_systems_complete'] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to add system: ${error.message}`);
    }
  });

  const handleSave = () => {
    if (!systemName || !systemTypeId || !nodeId) {
      toast.error('System Name, Type, and Node are required.');
      return;
    }
    
    const newSystem: TablesInsert<'systems'> = {
      system_name: systemName,
      system_type_id: systemTypeId,
      node_id: nodeId,
      commissioned_on: commissionedOn || null,
      status,
      remark: remark || null,
    };

    addSystem(newSystem);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" aria-modal="true">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            <FiServer />
            Add New System
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Name *</label>
                <input type="text" value={systemName} onChange={e => setSystemName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"/>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Type *</label>
                <select value={systemTypeId} onChange={e => setSystemTypeId(e.target.value)} disabled={isLoadingSystemTypes} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="">{isLoadingSystemTypes ? 'Loading...' : 'Select a type'}</option>
                    {systemTypes.map((type: any) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Node / Location *</label>
                <select value={nodeId} onChange={e => setNodeId(e.target.value)} disabled={isLoadingNodes} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="">{isLoadingNodes ? 'Loading...' : 'Select a node'}</option>
                    {(nodes as any)?.map((node: any) => <option key={node.id} value={node.id}>{node.name}</option>)}
                </select>
            </div>
    
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Commissioned On</label>
                <input type="date" value={commissionedOn} onChange={e => setCommissionedOn(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"/>
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remark</label>
                <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"></textarea>
            </div>
        </div>

        {/* Footer / Actions */}
        <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isAddingSystem}
              className="flex items-center gap-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSave />
              {isAddingSystem ? 'Saving...' : 'Save System'}
            </button>
        </div>
      </div>
    </div>
  );
};