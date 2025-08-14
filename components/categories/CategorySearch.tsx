import { FiSearch } from "react-icons/fi";
import { Input } from "@/components/common/ui/Input";

interface CategorySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CategorySearch({
  searchTerm,
  onSearchChange,
}: CategorySearchProps) {
  return (
    <div className="max-w-md">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Search Categories
      </label>
      <div className="relative">
        <FiSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          type="text"
          placeholder="Search unique categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>
    </div>
  );
}
