'use client';

// components/ofc/OfcForm/hooks/useCapacityInference.ts
import { useEffect, useRef, useState } from 'react';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { UseFormSetValue, Path, PathValue } from 'react-hook-form';
import { Ofc_cablesInsertSchema } from '@/schemas/zod-schemas';

interface UseCapacityInferenceProps<T extends Ofc_cablesInsertSchema> {
  currentOfcTypeId: string;
  ofcTypeOptions: Option[];
  setValue: UseFormSetValue<T>;
}

export const useCapacityInference = <T extends Ofc_cablesInsertSchema>({
  currentOfcTypeId,
  ofcTypeOptions,
  setValue,
}: UseCapacityInferenceProps<T>) => {
  const [isCapacityLocked, setIsCapacityLocked] = useState(false);
  const lastProcessedTypeId = useRef<string | null>(null);

  useEffect(() => {
    // Skip if we've already processed this OFC type ID
    if (lastProcessedTypeId.current === currentOfcTypeId) {
      return;
    }

    if (!currentOfcTypeId) {
      setIsCapacityLocked(false);
      lastProcessedTypeId.current = null;
      return;
    }

    const selectedOption = ofcTypeOptions.find(
      (opt) => opt.value === currentOfcTypeId
    );
    if (!selectedOption) {
      setIsCapacityLocked(false);
      lastProcessedTypeId.current = null;
      return;
    }

    const match = selectedOption.label.match(/(\d+)\s*F/i);
    if (match) {
      const inferredCapacity = parseInt(match[1], 10);
      // Only update if the value has changed
      setValue(
        'capacity' as Path<T>,
        inferredCapacity as unknown as PathValue<T, Path<T>>,
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        }
      );
      setIsCapacityLocked(true);
      lastProcessedTypeId.current = currentOfcTypeId;
    } else {
      setIsCapacityLocked(false);
      lastProcessedTypeId.current = null;
    }
  }, [currentOfcTypeId, ofcTypeOptions, setValue]);

  return { isCapacityLocked };
};
