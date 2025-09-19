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
}

const RouteConfigurationSection: React.FC<RouteConfigurationSectionProps> = ({
  control,
  errors,
  startingNodeOptions,
  endingNodeOptions,
  routeName,
}) => {
  // console.log('startingNodeOptions', startingNodeOptions);
  // console.log('endingNodeOptions', endingNodeOptions);
  // console.log('control', control);

  return (
    <FormSection
      title="Route Configuration"
      icon={Zap}
      iconColor="text-blue-600"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSearchableSelect
          name="sn_id"
          label="Starting Node"
          control={control}
          options={startingNodeOptions}
          error={errors.sn_id}
          placeholder="Select starting node"
          searchPlaceholder="Search starting nodes..."
          aria-describedby="sn-id-help"
        />
        <div id="sn-id-help" className="sr-only">
          Select the starting point for this fiber optic cable route
        </div>

        <FormSearchableSelect
          name="en_id"
          label="Ending Node"
          control={control}
          options={endingNodeOptions}
          error={errors.en_id}
          placeholder="Select ending node"
          searchPlaceholder="Search ending nodes..."
          aria-describedby="en-id-help"
        />
        <div id="en-id-help" className="sr-only">
          Select the ending point for this fiber optic cable route
        </div>
      </div>

      {routeName && (
        <div className="mt-6 space-y-2">
          <Label className="text-gray-700 dark:text-gray-300 font-medium">
            Generated Route Name
          </Label>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md px-3 py-2">
            <span className="text-blue-900 dark:text-blue-100 font-mono text-sm">
              {routeName}
            </span>
          </div>
        </div>
      )}
    </FormSection>
  );
};

export default RouteConfigurationSection;
