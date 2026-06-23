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
  if (val === undefined || val === null) return "";
  
  // Replace all commas with dots first so we have a unified decimal separator locator
  let normalized = val.replace(/,/g, ".");
  
  // Find the last dot in the string. If there is one, that represents the decimal separator
  const lastDotIdx = normalized.lastIndexOf(".");
  
  let integerPart = "";
  let decimalPart: string | undefined = undefined;
  
  if (lastDotIdx !== -1) {
    integerPart = normalized.substring(0, lastDotIdx).replace(/\D/g, "");
    decimalPart = normalized.substring(lastDotIdx + 1).replace(/\D/g, "");
    // Limit decimal part to exactly 2 digits
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }
  } else {
    integerPart = normalized.replace(/\D/g, "");
  }
  
  if (!integerPart && decimalPart === undefined) {
    return "";
  }
  
  if (!integerPart && decimalPart !== undefined) {
    integerPart = "0";
  }
  
  const integerNum = parseInt(integerPart, 10);
  if (isNaN(integerNum)) {
    return "";
  }
  
  // Use de-DE because it uses dot for thousands and comma for decimal
  const formattedInteger = new Intl.NumberFormat("de-DE").format(integerNum);
  
  if (decimalPart !== undefined) {
    return formattedInteger + "," + decimalPart;
  }
  
  return formattedInteger;
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

