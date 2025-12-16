// components/common/CommandMenu.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { FiSearch, FiServer, FiMapPin, FiActivity, FiFileText, FiWifiOff, FiLoader } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useDebounce } from "use-debounce";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { localDb } from "@/hooks/data/localDb";

// Basic types for search results
type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
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
  const isOnline = useOnlineStatus();

  // Toggle with Cmd+K OR "/"
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "/") {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setOpen((open) => !open);
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search Logic
  React.useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);

      const searchTerm = debouncedQuery.toLowerCase();
      const newResults: SearchResult[] = [];

      // 1. Static Pages matches (Always available)
      if ("dashboard".includes(searchTerm)) newResults.push({ id: 'home', title: 'Dashboard', type: 'page', url: '/dashboard' });
      if ("inventory".includes(searchTerm)) newResults.push({ id: 'inv', title: 'Inventory', type: 'page', url: '/dashboard/inventory' });
      if ("systems".includes(searchTerm)) newResults.push({ id: 'sys', title: 'Systems Manager', type: 'page', url: '/dashboard/systems' });
      if ("rings".includes(searchTerm)) newResults.push({ id: 'rng', title: 'Ring Manager', type: 'page', url: '/dashboard/rings' });
      if ("connections".includes(searchTerm)) newResults.push({ id: 'conn', title: 'Global Connections', type: 'page', url: '/dashboard/connections' });
      if ("logs".includes(searchTerm) || "diary".includes(searchTerm)) newResults.push({ id: 'log', title: 'Log Book', type: 'page', url: '/dashboard/diary' });

      try {
        if (isOnline) {
          // --- ONLINE SEARCH (RPC / Supabase) ---
          const rpcTerm = `%${searchTerm}%`;
          
          const [systems, nodes, cables] = await Promise.all([
            supabase.from('systems').select('id, system_name, ip_address').ilike('system_name', rpcTerm).limit(5),
            supabase.from('nodes').select('id, name, maintenance_terminal_id').ilike('name', rpcTerm).limit(5),
            supabase.from('ofc_cables').select('id, route_name').ilike('route_name', rpcTerm).limit(5)
          ]);

          systems.data?.forEach(s => newResults.push({ 
            id: s.id, 
            title: s.system_name || 'System', 
            subtitle: s.ip_address ? String(s.ip_address).split('/')[0] : undefined,
            type: 'system', 
            url: `/dashboard/systems/${s.id}` 
          }));
          
          nodes.data?.forEach(n => newResults.push({ 
            id: n.id, 
            title: n.name, 
            type: 'node', 
            url: `/dashboard/nodes?search=${encodeURIComponent(n.name)}` // Navigate to list view with filter
          }));
          
          cables.data?.forEach(c => newResults.push({ 
            id: c.id, 
            title: c.route_name, 
            type: 'cable', 
            url: `/dashboard/ofc/${c.id}` 
          }));

        } else {
          // --- OFFLINE SEARCH (Dexie / LocalDb) ---
          // Using Dexie's Collection.filter for case-insensitive partial match
          
          const [localSystems, localNodes, localCables] = await Promise.all([
            localDb.v_systems_complete
              .filter(s => (s.system_name || '').toLowerCase().includes(searchTerm))
              .limit(5)
              .toArray(),
            localDb.v_nodes_complete
              .filter(n => (n.name || '').toLowerCase().includes(searchTerm))
              .limit(5)
              .toArray(),
            localDb.v_ofc_cables_complete
              .filter(c => (c.route_name || '').toLowerCase().includes(searchTerm))
              .limit(5)
              .toArray()
          ]);

          localSystems.forEach(s => newResults.push({ 
             id: s.id!, 
             title: s.system_name!, 
             subtitle: s.ip_address ? String(s.ip_address).split('/')[0] : 'Offline Result',
             type: 'system', 
             url: `/dashboard/systems/${s.id}` 
          }));

          localNodes.forEach(n => newResults.push({ 
             id: n.id!, 
             title: n.name!, 
             type: 'node', 
             url: `/dashboard/nodes?search=${encodeURIComponent(n.name!)}` 
          }));

          localCables.forEach(c => newResults.push({ 
             id: c.id!, 
             title: c.route_name!, 
             type: 'cable', 
             url: `/dashboard/ofc/${c.id}` 
          }));
        }
      } catch (err) {
        console.error("Search error:", err);
      }

      setResults(newResults);
      setLoading(false);
    }

    search();
  }, [debouncedQuery, supabase, isOnline]);

  const handleSelect = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Global Search" shouldFilter={false} className="w-full">

          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <FiSearch className="w-5 h-5 text-gray-400 mr-3" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={isOnline ? "Search systems, routes, or pages..." : "Searching offline database..."}
              className="w-full py-4 text-lg bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              autoFocus
            />
            <div className="flex items-center gap-2">
              {loading && <FiLoader className="w-4 h-4 animate-spin text-blue-500" />}
              {!isOnline && <FiWifiOff className="w-4 h-4 text-orange-500" title="Offline Mode" />}
            </div>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">

            {query && results.length === 0 && !loading && (
              <div className="py-10 text-center text-sm text-gray-500">
                No results found {isOnline ? "" : "in local cache"}.
              </div>
            )}

            {!query && (
               <div className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Quick Navigation</p>
                  <Command.Item onSelect={() => handleSelect('/dashboard/systems')} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors">
                     <FiServer className="w-4 h-4" /> Systems Manager
                  </Command.Item>
                  <Command.Item onSelect={() => handleSelect('/dashboard/rings')} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors">
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
                    className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/20 aria-selected:text-blue-700 dark:aria-selected:text-blue-400 transition-colors"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded text-gray-500 ${
                        item.type === 'page' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        'bg-gray-100 dark:bg-gray-800'
                    }`}>
                        {item.type === 'system' && <FiServer size={16} />}
                        {item.type === 'node' && <FiMapPin size={16} />}
                        {item.type === 'cable' && <FiActivity size={16} />}
                        {item.type === 'page' && <FiFileText size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{item.title}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1 rounded">
                             {item.type}
                           </span>
                           {item.subtitle && (
                             <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                               {item.subtitle}
                             </span>
                           )}
                        </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

          </Command.List>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-xs text-gray-400">
            <span className="hidden sm:inline">Use <strong>↑↓</strong> to navigate</span>
            <span><strong>Enter</strong> to select</span>
            <span><strong>Esc</strong> to close</span>
          </div>
        </Command>
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}