// components/common/ui/Stepper.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex items-center justify-between">
        {/* Connecting Line - Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />

        {/* Connecting Line - Active Progress */}
        <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 dark:bg-blue-500 -z-10 transition-all duration-300" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const isClickable = onStepClick && stepNum < currentStep;

          return (
            <div key={step.id} className="relative flex flex-col items-center group">
                <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => onStepClick?.(stepNum)}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-200 z-10",
                        isCompleted 
                            ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" 
                            : isActive
                                ? "bg-white dark:bg-gray-900 border-blue-600 text-blue-600 dark:text-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/30"
                                : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400",
                        isClickable && "cursor-pointer hover:scale-105"
                    )}
                >
                    {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </button>
                
                <div className="absolute top-10 flex flex-col items-center w-32 text-center">
                    <span className={cn(
                        "text-xs font-semibold transition-colors duration-200",
                        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                    )}>
                        {step.label}
                    </span>
                    {step.description && isActive && (
                         <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5 hidden sm:block">
                            {step.description}
                         </span>
                    )}
                </div>
            </div>
          );
        })}
      </div>
      {/* Spacer to prevent overlap with labels */}
      <div className="h-8 sm:h-12" />
    </div>
  );
}