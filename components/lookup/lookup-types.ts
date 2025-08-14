export interface LookupType {
    id: string;
    category: string;
    name: string;
    code: string | null;
    description: string | null;
    sort_order: number | null;
    status: boolean | null;
    is_system_default: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  }
  
  export interface LookupTypesPageProps {
    initialCategory?: string;
  }