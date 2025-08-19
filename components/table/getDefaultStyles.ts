import { createFillPattern, ExcelStyles } from "@/hooks/database/excel-queries";

// DEBUG: Check what styles are being applied
export const getDefaultStyles = (): ExcelStyles => {
    const styles = {
      headerFont: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
      headerFill: createFillPattern("FF2563EB"),
      dataFont: { size: 11 },
      alternateRowFill: createFillPattern("FFF8F9FA"),
      borderStyle: { 
        top: { style: 'thin' as const }, 
        left: { style: 'thin' as const }, 
        bottom: { style: 'thin' as const }, 
        right: { style: 'thin' as const } 
      },
    };
    
    // console.log('Default styles:', styles);
    return styles;
  };
  
  // Alternative: Try without borders first to isolate the issue
  export const getMinimalStyles = (): ExcelStyles => ({
    headerFont: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
    headerFill: createFillPattern("FF2563EB"),
    dataFont: { size: 11 },
    alternateRowFill: createFillPattern("FFF8F9FA"),
    // Remove borderStyle completely to test
  });
  
  // TEST: Use this instead of getDefaultStyles() temporarily
  // const styles = getMinimalStyles();