// components/OfcForm/FormSection.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

interface FormSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon: Icon,
  iconColor,
  children,
}) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span>{title}</span>
    </h3>
    {children}
  </div>
);

export default FormSection;