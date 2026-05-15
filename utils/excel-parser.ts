// utils/excel-parser.ts
'use client';

/**
 * Parses an Excel or CSV file.
 * Returns a Promise that resolves to a 2D array of values.
 * Uses dynamic imports to keep the main bundle small while ensuring offline PWA compatibility.
 */
export const parseExcelFile = async (file: File): Promise<unknown[][]> => {
  // Fallback for server-side rendering
  if (typeof window === 'undefined') return[];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) {
          throw new Error('Failed to read file data');
        }

        // Dynamically import the locally installed XLSX package.
        // This guarantees offline support and prevents Next.js from bundling it 
        // into the initial load, saving ~800kb of JS.
        const XLSX = await import('xlsx');

        const workbook = XLSX.read(fileData, { type: 'array', cellDates: true });
        
        // THE FIX: Prevent crash if the file has absolutely no sheets
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('The uploaded Excel file contains no sheets or is corrupted.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to JSON (Header: 1 means array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          blankrows: false,
        }) as unknown[][];

        resolve(jsonData);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse Excel file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};