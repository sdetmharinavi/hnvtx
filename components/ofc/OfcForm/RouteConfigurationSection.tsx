// components/OfcForm/RouteConfigurationSection.tsx
import React from 'react';
import { Zap } from 'lucide-react';
import { Control, FieldErrors } from 'react-hook-form';
import { FormSearchableSelect } from '@/components/common/form/FormControls';
import { Label } from '@/components/common/ui/label/Label';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import FormSection from './FormSection';
import { Ofc_cablesInsertSchema } from '@/schemas/zod-schemas';

interface RouteConfigurationSectionProps {
  control: Control<Ofc_cablesInsertSchema>;
  errors: FieldErrors<Ofc_cablesInsertSchema>;
  startingNodeOptions: Option[];
  endingNodeOptions: Option[];
  routeName: string;
  onNodeSearch: (term: string) => void; // <-- ADDED
  isNodeSearchLoading: boolean;        // <-- ADDED
}

const RouteConfigurationSection: React.FC<RouteConfigurationSectionProps> = ({
  control,
  errors,
  startingNodeOptions,
  endingNodeOptions,
  routeName,
  onNodeSearch,          // <-- ADDED
  isNodeSearchLoading,   // <-- ADDED
}) => {
  return (
    <FormSection title="Route Configuration" icon={Zap} iconColor="text-blue-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSearchableSelect
          name="sn_id"
          label="Starting Node"
          control={control}
          options={startingNodeOptions}
          error={errors.sn_id}
          placeholder="Select starting node"
          searchPlaceholder="Search nodes..."
          required
          // **THE FIX: Add server-side search props**
          serverSide={true}
          onSearch={onNodeSearch}
          isLoading={isNodeSearchLoading}
        />
        
        <FormSearchableSelect
          name="en_id"
          label="Ending Node"
          control={control}
          options={endingNodeOptions}
          error={errors.en_id}
          placeholder="Select ending node"
          searchPlaceholder="Search nodes..."
          required
          // **THE FIX: Add server-side search props**
          serverSide={true}
          onSearch={onNodeSearch}
          isLoading={isNodeSearchLoading}
        />
      </div>

      {routeName && (
        <div className="mt-6 space-y-2">
          <Label className="text-gray-700 dark:text-gray-300 font-medium">Generated Route Name</Label>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md px-3 py-2">
            <span className="text-blue-900 dark:text-blue-100 font-mono text-sm">{routeName}</span>
          </div>
        </div>
      )}
    </FormSection>
  );
};

export default RouteConfigurationSection;