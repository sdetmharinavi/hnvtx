// components/maintenance-areas/AreaDetailsPanel.tsx
import { MdBusiness as Building2, MdEdit as Edit3, MdDelete as Trash2 } from "react-icons/md";
import { DetailItem } from "./DetailItem";
import { MaintenanceAreaWithRelations } from "./maintenance-areas-types";
import { FiMail, FiPhone, FiUser } from "react-icons/fi";
import { BiMapPin } from "react-icons/bi";
import { CiMapPin } from "react-icons/ci";
import { FaMapPin } from "react-icons/fa";

interface AreaDetailsPanelProps {
  selectedArea: MaintenanceAreaWithRelations | null;
  onEdit: (area: MaintenanceAreaWithRelations) => void;
  onDelete: (item: { id: string; name: string }) => void;
}

export function AreaDetailsPanel({ selectedArea, onEdit, onDelete }: AreaDetailsPanelProps) {
  return (
    <div className='rounded-lg bg-white shadow dark:bg-gray-800 dark:shadow-gray-700/50 self-start sticky top-4'>
      <div className='border-b border-gray-200 dark:border-gray-700 p-4'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Area Details</h2>
      </div>
      {selectedArea ? (
        <div className='p-4 space-y-4'>
          <div className='mb-2 flex items-start justify-between'>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>{selectedArea.name}</h3>
            <span className={`rounded-full px-2 py-1 text-xs ${
              selectedArea.status 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {selectedArea.status ? 'Active' : 'Inactive'}
            </span>
          </div>
          <DetailItem label="Code" value={selectedArea.code} />
          <DetailItem label="Type" value={selectedArea.area_type?.name} />
          <DetailItem label="Parent Area" value={selectedArea.parent_area?.name} />
          <DetailItem 
            label="Contact Person" 
            value={selectedArea.contact_person} 
            icon={<FiUser className='h-4 w-4 text-gray-400 dark:text-gray-500' />} 
          />
          <DetailItem 
            label="Contact Number" 
            value={selectedArea.contact_number} 
            icon={<FiPhone className='h-4 w-4 text-gray-400 dark:text-gray-500' />} 
          />
          <DetailItem 
            label="Email" 
            value={selectedArea.email} 
            icon={<FiMail className='h-4 w-4 text-gray-400 dark:text-gray-500' />} 
          />
          <DetailItem 
            label="Address" 
            value={selectedArea.address} 
            icon={<BiMapPin className='mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500' />} 
          />
          <DetailItem 
            label="Latitude" 
            value={selectedArea.latitude} 
            icon={<CiMapPin className='mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500' />} 
          />
          <DetailItem 
            label="Longitude" 
            value={selectedArea.longitude} 
            icon={<FaMapPin className='mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500' />} 
          />
          <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
            <div className='flex gap-2'>
              <button 
                onClick={() => onEdit(selectedArea)} 
                className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
              >
                <Edit3 className='h-4 w-4' /> Edit
              </button>
              <button 
                onClick={() => onDelete({ id: selectedArea.id, name: selectedArea.name })} 
                className='flex items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-700 px-4 py-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
              >
                <Trash2 className='h-4 w-4' /> Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
          <Building2 className='mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600' />
          <p>Select an area to view details</p>
        </div>
      )}
    </div>
  );
}