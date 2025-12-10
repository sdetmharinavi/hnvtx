// components/common/CommandMenu.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { FiSearch, FiServer, FiMapPin, FiActivity, FiFileText } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useDebounce } from "use-debounce";

// Basic types for search results
type SearchResult = {
  id: string;
  title: string;
  type: 'system' | 'node' | 'cable' | 'page';
  url: string;
};

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const supabase = createClient();

  // Toggle with Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search Logic
  React.useEffect(() => {
    async function search() {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      setLoading(true);
      
      const searchTerm = `%${debouncedQuery}%`;

      // Parallel queries for speed
      const [systems, nodes, cables] = await Promise.all([
        supabase.from('systems').select('id, system_name').ilike('system_name', searchTerm).limit(3),
        supabase.from('nodes').select('id, name').ilike('name', searchTerm).limit(3),
        supabase.from('ofc_cables').select('id, route_name').ilike('route_name', searchTerm).limit(3)
      ]);

      const newResults: SearchResult[] = [];

      // Static Pages
      if ("dashboard".includes(debouncedQuery.toLowerCase())) newResults.push({ id: 'home', title: 'Dashboard', type: 'page', url: '/dashboard' });
      if ("inventory".includes(debouncedQuery.toLowerCase())) newResults.push({ id: 'inv', title: 'Inventory', type: 'page', url: '/dashboard/inventory' });

      // DB Results
      systems.data?.forEach(s => newResults.push({ id: s.id, title: s.system_name || 'System', type: 'system', url: `/dashboard/systems/${s.id}` }));
      nodes.data?.forEach(n => newResults.push({ id: n.id, title: n.name, type: 'node', url: `/dashboard/nodes?search=${n.name}` })); // Nodes might not have details page, linking to table filter
      cables.data?.forEach(c => newResults.push({ id: c.id, title: c.route_name, type: 'cable', url: `/dashboard/ofc/${c.id}` }));

      setResults(newResults);
      setLoading(false);
    }

    search();
  }, [debouncedQuery, supabase]);

  const handleSelect = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-[20vh] px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <Command label="Global Search" shouldFilter={false} className="w-full">
          
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <FiSearch className="w-5 h-5 text-gray-400 mr-3" />
            <Command.Input 
              value={query}
              onValueChange={setQuery}
              placeholder="Search systems, nodes, cables..." 
              className="w-full py-4 text-base bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              autoFocus
            />
            {loading && <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>}
          </div>

          {/* Results List */}
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
            
            {query && results.length === 0 && !loading && (
              <div className="py-6 text-center text-sm text-gray-500">No results found.</div>
            )}

            {!query && (
               <div className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Quick Navigation</p>
                  {/* Default suggestions if query is empty */}
                  <Command.Item onSelect={() => handleSelect('/dashboard/systems')} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors">
                     <FiServer className="w-4 h-4" /> Systems Manager
                  </Command.Item>
                  <Command.Item onSelect={() => handleSelect('/dashboard/rings')} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors">
                     <FiActivity className="w-4 h-4" /> Ring Manager
                  </Command.Item>
               </div>
            )}

            {results.length > 0 && (
              <Command.Group heading="Search Results" className="px-2">
                {results.map((item) => (
                  <Command.Item
                    key={`${item.type}-${item.id}`}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                        {item.type === 'system' && <FiServer size={14} />}
                        {item.type === 'node' && <FiMapPin size={14} />}
                        {item.type === 'cable' && <FiActivity size={14} />}
                        {item.type === 'page' && <FiFileText size={14} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{item.type}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

          </Command.List>
          
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-xs text-gray-400">
            <span>Use arrows to navigate</span>
            <span>ESC to close</span>
          </div>
        </Command>
      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}