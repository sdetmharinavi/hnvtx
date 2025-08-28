"use client"

// components/ofc/OfcForm/hooks/useCapacityInference.ts
import { useEffect } from "react";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import { useState } from "react";
import { UseFormSetValue, Path, PathValue } from "react-hook-form";
import { OfcCableFormData } from "@/schemas";

interface UseCapacityInferenceProps<T extends OfcCableFormData> {
  currentOfcTypeId: string;
  ofcTypeOptions: Option[];
  setValue: UseFormSetValue<T>;
}

export const useCapacityInference = <T extends OfcCableFormData>({
  currentOfcTypeId,
  ofcTypeOptions,
  setValue,
}: UseCapacityInferenceProps<T>) => {
  const [isCapacityLocked, setIsCapacityLocked] = useState(false);

  useEffect(() => {
    if (!currentOfcTypeId) {
      setIsCapacityLocked(false);
      return;
    }

    const selectedOption = ofcTypeOptions.find(opt => opt.value === currentOfcTypeId);
    if (!selectedOption) {
      setIsCapacityLocked(false);
      return;
    }

    const match = selectedOption.label.match(/(\d+)\s*F/i);
    if (match) {
      const inferredCapacity = parseInt(match[1], 10);
      // Convert to string first to match the expected input type for requiredStringToNumber
      setValue("capacity" as Path<T>, inferredCapacity.toString() as unknown as PathValue<T, Path<T>>, { shouldValidate: true });
      setIsCapacityLocked(true);
    } else {
      setIsCapacityLocked(false);
    }
  }, [currentOfcTypeId, ofcTypeOptions, setValue]);

  return { isCapacityLocked };
};