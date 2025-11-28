import TruncateTooltip from "@/components/common/TruncateTooltip";
import React, { JSX } from "react";

export function renderKeyValueCell(value: unknown): JSX.Element {
  if (!value) {
    return (
      <div className="text-sm text-gray-500">
        N/A
      </div>
    );
  }

  try {
    const parsedValue = typeof value === "string" ? JSON.parse(value) : value;

    // Handle object/array types
    if (typeof parsedValue === "object" && parsedValue !== null) {
      const entries = Object.entries(parsedValue).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, val]) => val !== null && val !== undefined && val !== ""
      );

      if (entries.length === 0) {
        return (
          <div className="text-sm text-gray-500">
            N/A
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {entries.map(([key, val]) => (
            <div
              key={key}
              className="flex flex-col gap-2 text-sm text-gray-700"
            >
              <TruncateTooltip text={key} className="font-semibold text-gray-900 dark:text-gray-100 min-w-max w-32" />
              <TruncateTooltip text={String(val)} className="break-words text-gray-600 dark:text-gray-400 flex-1 w-32" />
            </div>
          ))}
        </div>
      );
    }

    // Handle primitive types
    return (
      <div className="text-sm text-gray-700 break-words">
        {String(parsedValue)}
      </div>
    );
  } catch (error) {
    console.log(error);
    return (
      <div className="text-sm text-gray-700 break-words">
        {String(value)}
      </div>
    );
  }
}

