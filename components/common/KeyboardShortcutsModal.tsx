// components/common/KeyboardShortcutsModal.tsx
"use client";

import {  useState } from "react";
import { Modal } from "@/components/common/ui";
import { Command, Search, X, Save, Filter } from "lucide-react";
import { useHotkeys } from "@/hooks/useHotkeys";

interface ShortcutGroup {
  category: string;
  shortcuts: { keys: string[]; description: string; icon?: React.ElementType }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open Command Menu / Global Search", icon: Command },
      { keys: ["Esc"], description: "Close Modals / Clear Selection", icon: X },
      { keys: ["?"], description: "Show Keyboard Shortcuts (this window)" },
    ]
  },
  {
    category: "Data Tables",
    shortcuts: [
      { keys: ["/"], description: "Focus Search Bar", icon: Search },
      { keys: ["Shift", "F"], description: "Toggle Filters Panel", icon: Filter },
      { keys: ["Shift", "R"], description: "Refresh Data" },
    ]
  },
  {
    category: "Forms & Actions",
    shortcuts: [
      { keys: ["Ctrl", "Enter"], description: "Submit Form", icon: Save },
    ]
  }
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle with '?' (Shift + /) or Ctrl+/
  useHotkeys('shift+?', () => setIsOpen(prev => !prev));
  useHotkeys('ctrl+/', () => setIsOpen(prev => !prev));

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Keyboard Shortcuts" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
        {SHORTCUTS.map((group) => (
          <div key={group.category} className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1">
              {group.category}
            </h4>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.icon && <shortcut.icon className="w-3.5 h-3.5 text-gray-400" />}
                    <span>{shortcut.description}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="min-w-6 text-center px-1.5 py-0.5 text-xs font-sans font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}