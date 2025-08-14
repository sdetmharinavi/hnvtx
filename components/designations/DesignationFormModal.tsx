import { useEffect, useMemo, useState, FormEvent } from "react";
import { TablesInsert } from "@/types/supabase-types";
import { EmployeeDesignation, DesignationWithRelations } from "@/components/designations/designationTypes";

const EMPTY_FORM_DATA: TablesInsert<"employee_designations"> = {
  name: "",
  parent_id: null,
  status: true,
};

interface DesignationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TablesInsert<"employee_designations">) => void;
  designation: DesignationWithRelations | null;
  allDesignations: EmployeeDesignation[];
  isLoading: boolean;
}

export function DesignationFormModal({
  isOpen,
  onClose,
  onSubmit,
  designation,
  allDesignations,
  isLoading,
}: DesignationFormModalProps) {
  const [formData, setFormData] = useState<TablesInsert<"employee_designations">>(EMPTY_FORM_DATA);

  useEffect(() => {
    if (designation) {
      setFormData({
        name: designation.name,
        parent_id: designation.parent_id,
      });
    } else {
      setFormData(EMPTY_FORM_DATA);
    }
  }, [designation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const availableParents = useMemo(() => {
    if (!designation) return allDesignations;

    const getDescendantIds = (designationId: string, designations: EmployeeDesignation[]): Set<string> => {
      const descendants = new Set<string>([designationId]);
      const children = designations.filter((d) => d.parent_id === designationId);
      children.forEach((child) => {
        const childDescendants = getDescendantIds(child.id, designations);
        childDescendants.forEach((id) => descendants.add(id));
      });
      return descendants;
    };

    const excludeIds = getDescendantIds(designation.id, allDesignations);
    return allDesignations.filter((d) => !excludeIds.has(d.id));
  }, [designation, allDesignations]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>{designation ? "Edit Designation" : "Add New Designation"}</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Designation Name *</label>
            <input
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='Designation Name'
              required
              className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Parent Designation</label>
            <select
              name='parent_id'
              value={formData.parent_id ?? ""}
              onChange={handleChange}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600'>
              <option value=''>No Parent (Root Level)</option>
              {availableParents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className='flex gap-3 pt-4'>
            <button type='button' onClick={onClose} disabled={isLoading} className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'>
              Cancel
            </button>
            <button type='submit' disabled={isLoading || !formData.name.trim()} className='flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800'>
              {isLoading ? "Saving..." : designation ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}