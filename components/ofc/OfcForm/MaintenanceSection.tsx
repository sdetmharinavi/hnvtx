// components/OfcForm/MaintenanceSection.tsx
import React from 'react';
import { Settings } from 'lucide-react';
import { Control, FieldErrors } from 'react-hook-form';
import {
  FormSearchableSelect,
  FormTextarea,
} from '@/components/common/form/FormControls';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import FormSection from './FormSection';
import { Ofc_cablesInsertSchema } from '@/schemas/zod-schemas';

interface MaintenanceSectionProps {
  control: Control<Ofc_cablesInsertSchema>;
  errors: FieldErrors<Ofc_cablesInsertSchema>;
  maintenanceTerminalOptions: Option[];
}

const MaintenanceSection: React.FC<MaintenanceSectionProps> = ({
  control,
  errors,
  maintenanceTerminalOptions,
}) => (
  <FormSection
    title="Maintenance Information"
    icon={Settings}
    iconColor="text-orange-600"
  >
    <div className="grid grid-cols-1 gap-6">
      <FormSearchableSelect
        name="maintenance_terminal_id"
        label="Maintenance Terminal"
        control={control}
        options={maintenanceTerminalOptions}
        error={errors.maintenance_terminal_id}
        placeholder="Select maintenance terminal"
        searchPlaceholder="Search maintenance terminals..."
      />

      <FormTextarea
        name="remark"
        label="Additional Notes"
        control={control}
        error={errors.remark}
        placeholder="Enter any maintenance notes, installation details, or other relevant information..."
      />
    </div>
  </FormSection>
);

export default MaintenanceSection;
