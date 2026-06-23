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
 * Only allows up to 2 decimal digits.
 */
export const formatInputARS = (val: string): string => {
  if (val === undefined || val === null || val === "") return "";
  
  // If user typed dot at the end, treat it as a comma (decimal separator)
  let cleanVal = val.trim();
  if (cleanVal.endsWith(".")) {
    cleanVal = cleanVal.slice(0, -1) + ",";
  }
  
  // Handle case where user might have multiple commas by keeping only the first one
  const commaCount = (cleanVal.match(/,/g) || []).length;
  if (commaCount > 1) {
    const firstCommaIdx = cleanVal.indexOf(",");
    const beforeComma = cleanVal.substring(0, firstCommaIdx);
    const afterComma = cleanVal.substring(firstCommaIdx + 1).replace(/,/g, "");
    cleanVal = beforeComma + "," + afterComma;
  }
  
  const parts = cleanVal.split(",");
  const integerPartRaw = parts[0];
  const decimalPartRaw = parts.length > 1 ? parts[1] : undefined;
  
  // Strip all non-digits from upper integer part (which removes previous thousand dot symbols)
  const integerPart = integerPartRaw.replace(/\D/g, "");
  
  // Strip all non-digits from the decimal part
  let decimalPart = decimalPartRaw !== undefined ? decimalPartRaw.replace(/\D/g, "") : undefined;
  
  if (decimalPart !== undefined && decimalPart.length > 2) {
    decimalPart = decimalPart.substring(0, 2);
  }
  
  if (!integerPart && decimalPart === undefined) {
    return "";
  }
  
  let finalInteger = "0";
  if (integerPart) {
    const integerNum = parseInt(integerPart, 10);
    if (!isNaN(integerNum)) {
      finalInteger = new Intl.NumberFormat("de-DE").format(integerNum);
    }
  }
  
  if (decimalPart !== undefined) {
    return finalInteger + "," + decimalPart;
  }
  
  return finalInteger;
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

