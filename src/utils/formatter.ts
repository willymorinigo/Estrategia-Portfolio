/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number to Argentine decimal system.
 * Uses dot (.) as thousands separator and comma (,) as decimal separator.
 * Example: 1250312.5 => $ 1.250.312,50
 */
export const formatARS = (value: number, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "$ 0,00";
  }
  
  // Custom or Intl formatting for es-AR
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  
  return `$ ${formatted}`;
};

/**
 * Formats raw numbers (like quantities) to Argentine style.
 * Example: 1500.5 => 1.500,5
 */
export const formatNumberAr = (value: number, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formats a raw user input on-the-fly to Argentine local style.
 * Uses dot (.) as thousands separator and comma (,) as decimal separator.
 * Allows custom maximum decimal digits.
 */
export const formatInputArNumber = (val: string, maxDecimals: number = 2): string => {
  if (val === undefined || val === null) return "";
  
  // 1. Keep only digits, dots, and commas
  let cleanVal = val.replace(/[^0-9.,]/g, "");
  
  // 2. If user types a dot at the end (e.g. "123."), convert it to a comma
  // so it acts as a decimal separator in Argentine format.
  if (cleanVal.endsWith(".")) {
    cleanVal = cleanVal.slice(0, -1) + ",";
  }
  
  // 3. Under Argentine style, only the comma (",") is the decimal separator.
  // Any dots in the input are thousands separators. We strip all dots to get the clean base number.
  const hasComma = cleanVal.includes(",");
  
  if (hasComma) {
    // Split by the first comma
    const parts = cleanVal.split(",");
    const integerPartRaw = parts[0];
    const decimalPartRaw = parts.slice(1).join(""); // combine anything after
    
    // Clean both parts to only contain digits
    const integerPart = integerPartRaw.replace(/\D/g, "");
    let decimalPart = decimalPartRaw.replace(/\D/g, "");
    
    if (decimalPart.length > maxDecimals) {
      decimalPart = decimalPart.substring(0, maxDecimals);
    }
    
    let finalInteger = "0";
    if (integerPart) {
      const integerNum = parseInt(integerPart, 10);
      if (!isNaN(integerNum)) {
        finalInteger = new Intl.NumberFormat("es-AR", { useGrouping: true }).format(integerNum);
      }
    }
    
    return finalInteger + "," + decimalPart;
  } else {
    // No comma in the input. Strip all dots (thousands separators) to get the clean number.
    const integerPart = cleanVal.replace(/\./g, "").replace(/\D/g, "");
    if (!integerPart) return "";
    
    const integerNum = parseInt(integerPart, 10);
    if (isNaN(integerNum)) return "";
    
    return new Intl.NumberFormat("es-AR", { useGrouping: true }).format(integerNum);
  }
};

/**
 * Formats a raw user input on-the-fly for price fields (2 decimal digits).
 */
export const formatInputARS = (val: string): string => {
  return formatInputArNumber(val, 2);
};

/**
 * Formats a raw user input on-the-fly for quantity fields (4 decimal digits).
 */
export const formatInputQty = (val: string): string => {
  return formatInputArNumber(val, 4);
};

/**
 * Parses an Argentine formatted string back to a valid floating point number.
 */
export const parseInputARS = (val: string): number => {
  if (!val) return 0;
  const cleaned = val.replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

