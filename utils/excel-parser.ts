// utils/excel-parser.ts
"use client";

// Inline Worker Code to avoid Next.js/Webpack worker-loader complexity
const workerCode = `
self.onmessage = async (e) => {
  const { fileData, type } = e.data;
  
  try {
    // Import XLSX from CDN for the worker context
    // This avoids bundling heavy xlsx library in the main bundle if not needed immediately
    importScripts('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');

    const workbook = self.XLSX.read(fileData, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse to JSON (Header: 1 means array of arrays)
    const jsonData = self.XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: null,
      blankrows: false 
    });

    self.postMessage({ success: true, data: jsonData });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
`;

/**
 * Parses an Excel or CSV file using a Web Worker to prevent UI freezing.
 * Returns a Promise that resolves to a 2D array of values.
 */
export const parseExcelFile = async (file: File): Promise<unknown[][]> => {
  // Fallback for server-side rendering
  if (typeof window === 'undefined') return [];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        
        // Create worker from blob
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        worker.onmessage = (event) => {
          const { success, data, error } = event.data;
          
          // Cleanup
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          if (success) {
            resolve(data);
          } else {
            reject(new Error(error || 'Worker failed to parse Excel file'));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error('Excel Worker Error: ' + err.message));
        };

        // Start processing
        worker.postMessage({ fileData });

      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};