// components/categories/categories-types.ts
import { z } from 'zod';
import { lookup_typesRowSchema } from '@/schemas/zod-schemas';

// THE FIX: Derive all types from the Zod schema
export type Categories = z.infer<typeof lookup_typesRowSchema>;

export type GroupedLookupsByCategory = Record<string, Categories[]>;

export interface CategoryInfo {
    name: string;
    lookupCount: number;
    hasSystemDefaults: boolean;
}