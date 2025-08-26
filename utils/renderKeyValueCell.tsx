import React, { JSX } from "react";

export function renderKeyValueCell(value: unknown): JSX.Element {
  let elements: JSX.Element[] = [];

  if (value) {
    try {
      const parsedValue =
        typeof value === "string" ? JSON.parse(value) : value;

      if (typeof parsedValue === "object" && parsedValue !== null) {
        elements = Object.entries(parsedValue)
          .filter(([_, val]) => val !== null && val !== undefined && val !== "")
          .map(([key, val]) => (
            <div key={key} className="flex text-sm text-gray-500">
              <span className="font-medium mr-1">{key}:</span>
              <span>{String(val)}</span>
            </div>
          ));
      } else {
        elements = [
          <div key="single" className="text-sm text-gray-500">
            {String(parsedValue)}
          </div>,
        ];
      }
    } catch (error) {
      elements = [
        <div key="error" className="text-sm text-gray-500">
          {String(value)}
        </div>,
      ];
    }
  }

  return elements.length > 0 ? (
    <div className="text-sm text-gray-500">{elements}</div>
  ) : (
    <div className="text-sm text-gray-500">N/A</div>
  );
}
