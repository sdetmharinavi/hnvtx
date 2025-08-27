// components/OfcForm/ExistingRoutesAlert.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";

interface ExistingRoutesAlertProps {
  routes: string[];
}

const ExistingRoutesAlert: React.FC<ExistingRoutesAlertProps> = ({ routes }) => {
  if (!routes.length) return null;

  return (
    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Existing Routes Found
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {routes.length} cable route{routes.length > 1 ? "s" : ""} already exist between these nodes:
          </p>
          <ul className="mt-2 space-y-1 max-h-20 overflow-y-auto">
            {routes.map((route, index) => (
              <li
                key={index}
                className="text-sm text-amber-700 dark:text-amber-300 flex items-center space-x-2"
              >
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                <span className="font-mono truncate">{route}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExistingRoutesAlert;