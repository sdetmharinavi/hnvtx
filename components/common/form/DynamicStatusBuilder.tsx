"use client";

import React, { useState, useMemo } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Label } from "@/components/common/ui/label/Label";
import { Control, useController } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';

interface StatusItem {
  id: string;
  label: string;
  value: string;
  color: string;
}

interface DynamicStatusBuilderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  label?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}

const COLOR_OPTIONS = [
  { label: "Blue", class: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { label: "Green", class: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  { label: "Red", class: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { label: "Amber", class: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Purple", class: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { label: "Gray", class: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
];

// Helper moved outside component to avoid recreation
const parseHtmlToItems = (html: string | null): StatusItem[] => {
  if (!html) return [];
  
  const lines = html.split(/<br\s*\/?>/i).map(l => l.trim()).filter(Boolean);
  
  return lines.map(line => {
    const match = line.match(/<strong\s+class="([^"]+)">\s*([^:]+):<\/strong>\s*(.*)/i);
    
    if (match) {
      return {
        id: uuidv4(),
        color: match[1], 
        label: match[2].trim(),
        value: match[3].trim()
      };
    } else {
      return {
          id: uuidv4(),
          color: 'text-gray-600',
          label: 'Note',
          value: line
      };
    }
  });
};

// Helper moved outside component
const generateHtml = (currentItems: StatusItem[]) => {
  if (currentItems.length === 0) return null;
  return currentItems
    .map(item => `<strong class="${item.color}">${item.label}:</strong> ${item.value}<br />`)
    .join("\n");
};

export const DynamicStatusBuilder = ({ control, name, label, error }: DynamicStatusBuilderProps) => {
  // 1. Use useController to get field values at the top level
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
  });

  // Local state for input fields
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].class);

  // 2. Now useMemo is valid here
  const items = useMemo(() => parseHtmlToItems(value), [value]);

  const handleAddItem = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    
    const newItem: StatusItem = {
      id: uuidv4(),
      label: newLabel.trim(),
      value: newValue.trim(),
      color: newColor
    };
    
    const updatedItems = [...items, newItem];
    onChange(generateHtml(updatedItems));
    
    setNewLabel("");
    setNewValue("");
  };

  const handleRemoveItem = (idToRemove: string) => {
    const updatedItems = items.filter(item => item.id !== idToRemove);
    onChange(generateHtml(updatedItems));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAddItem();
      }
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      
      {/* List of Existing Items */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-2 border border-dashed border-gray-300 rounded-lg">
              No details added yet.
          </p>
        )}
        {items.map((item) => {
          const colorObj = COLOR_OPTIONS.find(c => c.class === item.color) || COLOR_OPTIONS[5]; 
          return (
            <div 
              key={item.id} 
              className={`flex items-start justify-between p-3 rounded-lg border ${colorObj.border} bg-opacity-50 dark:bg-opacity-10 transition-all`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm break-all">
                <span className={`font-bold ${item.color} whitespace-nowrap`}>{item.label}:</span>
                <span 
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  dangerouslySetInnerHTML={{ __html: item.value }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors ml-2"
                title="Remove line"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Label</label>
              <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. OFC STATUS"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={handleKeyPress}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Color</label>
              <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                  {COLOR_OPTIONS.map(opt => (
                  <option key={opt.class} value={opt.class}>{opt.label}</option>
                  ))}
              </select>
            </div>
        </div>
        
        <div>
          <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Value</label>
          <div className="flex gap-2">
              <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. READY"
              className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={handleKeyPress}
              />
              <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm font-medium"
              >
              <FiPlus /> Add
              </button>
          </div>
        </div>
      </div>
      
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
};