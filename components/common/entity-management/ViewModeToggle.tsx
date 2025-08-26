interface ViewModeToggleProps {
    viewMode: "tree" | "list";
    onChange: (mode: "tree" | "list") => void;
  }
  
  export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
    return (
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange("tree")}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              viewMode === "tree"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Tree
          </button>
          <button
            onClick={() => onChange("list")}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              viewMode === "list"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            List
          </button>
        </div>
      </div>
    );
  }