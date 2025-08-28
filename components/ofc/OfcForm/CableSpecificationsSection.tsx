// components/OfcForm/CableSpecificationsSection.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import {
  FormInput,
  FormSearchableSelect,
  FormDateInput,
} from '@/components/common/ui/form/FormControls';
import { Switch } from '@/components/common/ui/switch/Switch';
import { Label } from '@/components/common/ui/label/Label';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { OfcCableFormData } from '@/schemas';
import { OFC_FORM_CONFIG } from '@/components/ofc/OfcForm/constants/ofcFormConfig';
import FormSection from './FormSection';

interface CableSpecificationsSectionProps {
  control: Control<OfcCableFormData>;
  register: UseFormRegister<OfcCableFormData>;
  errors: FieldErrors<OfcCableFormData>;
  setValue: UseFormSetValue<OfcCableFormData>;
  watch: UseFormWatch<OfcCableFormData>;
  ofcTypeOptions: Option[];
  isCapacityLocked: boolean;
}

const CableSpecificationsSection: React.FC<CableSpecificationsSectionProps> = ({
  control,
  register,
  errors,
  setValue,
  watch,
  ofcTypeOptions,
  isCapacityLocked,
}) => {
  const currentStatus = watch('status');

  return (
    <FormSection
      title="Cable Specifications"
      icon={FileText}
      iconColor="text-green-600"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormInput
          name="asset_no"
          label="Asset Number"
          register={register}
          error={errors.asset_no}
          placeholder="Enter asset number"
        />

        <FormSearchableSelect
          name="ofc_type_id"
          label="OFC Type"
          control={control}
          options={ofcTypeOptions}
          error={errors.ofc_type_id}
          placeholder="Select OFC type"
          searchPlaceholder="Search OFC types..."
        />

        <div className="space-y-2">
          {isCapacityLocked ? (
            <FormInput
              name="capacity"
              label="Capacity"
              register={register}
              error={errors.capacity}
              placeholder="Capacity will be set from OFC type"
              type="number"
              disabled
            />
          ) : (
            <FormSearchableSelect
              name="capacity"
              control={control}
              label="Capacity"
              error={errors.capacity}
              placeholder="Select capacity"
              searchPlaceholder="Search capacities..."
              options={OFC_FORM_CONFIG.CAPACITY_OPTIONS as unknown as Option[]}
            />
          )}
          {isCapacityLocked && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Capacity inferred from selected OFC type and locked.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FormInput
          name="current_rkm"
          label="Current RKM (km)"
          register={register}
          error={errors.current_rkm}
          placeholder="Enter current RKM"
          type="number"
          step="0.01"
        />

        <FormInput
          name="transnet_rkm"
          label="Transnet RKM (km)"
          register={register}
          error={errors.transnet_rkm}
          placeholder="Enter transnet RKM"
          type="number"
          step="0.01"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FormInput
          name="transnet_id"
          label="Transnet ID"
          register={register}
          error={errors.transnet_id}
          placeholder="Enter transnet ID"
        />

        <FormDateInput
          name="commissioned_on"
          label="Commissioned Date"
          control={control}
          error={errors.commissioned_on}
          placeholder="Select commissioned date"
        />
      </div>

      <div className="flex items-center space-x-3 pt-6">
        <Switch
          id="status"
          checked={currentStatus ?? true}
          onChange={(checked: boolean) => setValue('status', checked)}
          className="dark:bg-gray-600"
        />
        <Label
          htmlFor="status"
          className="text-gray-700 dark:text-gray-300 font-medium"
        >
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentStatus
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {currentStatus ? 'Active' : 'Inactive'}
          </span>
        </Label>
      </div>
    </FormSection>
  );
};

export default CableSpecificationsSection;
