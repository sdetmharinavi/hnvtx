// components/route-manager/ui/AddJcForm.tsx
"use client";

import { useState } from 'react';
import { Equipment, RouteDetailsPayload } from '@/components/route-manager/types';

interface Props {
  route: RouteDetailsPayload['route'];
  onAddJc: (jc: Omit<Equipment, 'id' | 'status'>) => void;
}

// Define the initial state for the form
const getInitialState = () => ({
  name: '',
  latitude: 0,
  longitude: 0,
  jc_type: 'inline' as const,
  capacity: 48,
  position_on_route: 50,
});

export default function AddJcForm({ route, onAddJc }: Props) {
  const [newJC, setNewJC] = useState(getInitialState());

  const handleSubmit = () => {
    // Basic validation
    if (!newJC.name || newJC.latitude === 0 || newJC.longitude === 0) {
      alert('Please fill in JC Name, Latitude, and Longitude.');
      return;
    }

    // Call the parent component's handler with the structured data
    onAddJc({
      name: newJC.name,
      equipment_type: 'junction_closure',
      latitude: newJC.latitude,
      longitude: newJC.longitude,
      attributes: {
        jc_type: newJC.jc_type,
        capacity: newJC.capacity,
        position_on_route: newJC.position_on_route,
      },
    });

    // Reset the form for the next entry
    setNewJC(getInitialState());
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Junction Closure</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            JC Name *
          </label>
          <input
            type="text"
            value={newJC.name}
            onChange={(e) => setNewJC({ ...newJC, name: e.target.value })}
            placeholder="JC-SITE-001"
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={newJC.latitude || ''}
              onChange={(e) => setNewJC({ ...newJC, latitude: parseFloat(e.target.value) })}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={newJC.longitude || ''}
              onChange={(e) => setNewJC({ ...newJC, longitude: parseFloat(e.target.value) })}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position on Route: {newJC.position_on_route}%
          </label>
          <input
            type="range"
            min="5"
            max="95"
            value={newJC.position_on_route}
            onChange={(e) => setNewJC({ ...newJC, position_on_route: Number(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            ~{(route.distance_km * newJC.position_on_route / 100).toFixed(1)} km from {route.start_site.name}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              JC Type
            </label>
            <select
              value={newJC.jc_type}
              onChange={(e) => setNewJC({ ...newJC, jc_type: e.target.value as any })}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="inline">Inline</option>
              <option value="branching">Branching</option>
              <option value="terminal">Terminal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Splice Capacity
            </label>
            <select
              value={newJC.capacity}
              onChange={(e) => setNewJC({ ...newJC, capacity: Number(e.target.value) })}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={24}>24 Splice</option>
              <option value={48}>48 Splice</option>
              <option value={96}>96 Splice</option>
              <option value={144}>144 Splice</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!newJC.name || newJC.latitude === 0 || newJC.longitude === 0}
          className="w-full p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-semibold"
        >
          Add JC to Route
        </button>
      </div>
    </div>
  );
}