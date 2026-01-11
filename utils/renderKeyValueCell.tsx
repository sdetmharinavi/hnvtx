import TruncateTooltip from '@/components/common/TruncateTooltip';
import React, { JSX } from 'react';

export function renderKeyValueCell(value: unknown): JSX.Element {
  // 1. Handle empty values immediately
  if (value === null || value === undefined || value === '') {
    return <div className="text-sm text-gray-500 italic">—</div>;
  }

  try {
    let parsedValue = value;

    // 2. Safe parsing logic for strings
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // Check for the specific "bad" string that causes the SyntaxError
      if (trimmed === '[object Object]') {
        return (
          <div className="text-xs text-red-500 italic bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded">
            Invalid Data Format
          </div>
        );
      }

      // Only attempt JSON.parse if it actually looks like a JSON object or array
      // This prevents parsing normal strings like "123 Main St" which might technically be valid JSON numbers but shouldn't be treated as objects
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          parsedValue = JSON.parse(trimmed);
        } catch {
          // If parse fails, treat as a regular string and display as is
          parsedValue = value;
        }
      }
    }

    // 3. Render Objects / Arrays
    if (typeof parsedValue === 'object' && parsedValue !== null) {
      const entries = Object.entries(parsedValue as Record<string, unknown>).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, val]) => val !== null && val !== undefined && val !== ''
      );

      if (entries.length === 0) {
        return <div className="text-sm text-gray-400 italic">Empty</div>;
      }

      return (
        <div className="space-y-1.5 my-1">
          {entries.map(([key, val]) => (
            <div key={key} className="flex flex-col text-sm">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </span>
              <TruncateTooltip
                text={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                className="text-gray-900 dark:text-gray-100 font-medium"
              />
            </div>
          ))}
        </div>
      );
    }

    // 4. Render Primitives (Strings, Numbers, Booleans)
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300 wrap-break-word">
        {String(parsedValue)}
      </div>
    );
  } catch (error) {
    console.error('Error rendering key-value cell:', error);
    return <div className="text-sm text-gray-500">{String(value)}</div>;
  }
}
