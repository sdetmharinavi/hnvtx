import { FiSearch } from "react-icons/fi";
import { Input } from "@/components/common/ui/Input";
import { SearchableSelect, Option } from "@/components/common/SearchableSelect";

interface NodesFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  nodeTypes: Array<{ id: string; name: string }>;
  selectedNodeType?: string;
  onNodeTypeChange: (value: string | null) => void;
}

export function NodesFilters({ searchQuery, onSearchChange, nodeTypes, selectedNodeType = "", onNodeTypeChange }: NodesFiltersProps) {
  const nodeTypeOptions: Option[] = (nodeTypes || []).map((nt) => ({ value: nt.id, label: nt.name }));

  return (
    <div className='w-full'>
      <div className='flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-start'>
        <div className='relative flex-1 sm:max-w-md lg:max-w-xl'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5' />
          <Input type='text' placeholder='Search nodes...' value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
        <div className='w-full sm:w-64'>
          <SearchableSelect
            options={nodeTypeOptions}
            value={selectedNodeType}
            onChange={(v) => onNodeTypeChange(v)}
            placeholder='Filter by node type'
            searchPlaceholder='Search node types...'
            clearable={true}
          />
        </div>
      </div>
    </div>
  );
}

export default NodesFilters;
