/**
 * Utility functions for safe formatting of numbers and currency values
 */

/**
 * Safely formats a number as currency with locale string
 * @param value - The number to format (can be undefined, null, or number)
 * @param options - Formatting options
 * @returns Formatted currency string or fallback value
 */
export function formatCurrency(
  value: number | undefined | null, 
  options: {
    fallback?: string;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const { fallback = '-', prefix = '$', suffix = '' } = options;
  
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  
  try {
    return `${prefix}${value.toLocaleString()}${suffix}`;
  } catch (error) {
    console.warn('Failed to format currency:', value, error);
    return fallback;
  }
}

/**
 * Safely formats a number with locale string
 * @param value - The number to format (can be undefined, null, or number)
 * @param options - Formatting options
 * @returns Formatted number string or fallback value
 */
export function formatNumber(
  value: number | undefined | null,
  options: {
    fallback?: string;
    decimals?: number;
    suffix?: string;
  } = {}
): string {
  const { fallback = '-', decimals, suffix = '' } = options;
  
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  
  try {
    let formattedValue = value.toLocaleString();
    
    if (decimals !== undefined) {
      formattedValue = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    
    return `${formattedValue}${suffix}`;
  } catch (error) {
    console.warn('Failed to format number:', value, error);
    return fallback;
  }
}

/**
 * Safely formats a percentage value
 * @param value - The number to format as percentage (can be undefined, null, or number)
 * @param options - Formatting options
 * @returns Formatted percentage string or fallback value
 */
export function formatPercentage(
  value: number | undefined | null,
  options: {
    fallback?: string;
    decimals?: number;
  } = {}
): string {
  const { fallback = '-', decimals = 0 } = options;
  
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  
  try {
    return `${value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}%`;
  } catch (error) {
    console.warn('Failed to format percentage:', value, error);
    return fallback;
  }
}

/**
 * Safely calculates and formats stats from an array of quotes
 * @param quotes - Array of quote objects
 * @returns Formatted stats object with safe number formatting
 */
export function calculateQuoteStats(quotes: any[]): {
  totalValue: string;
  averageValue: string;
  totalProfit: string;
  count: number;
} {
  const safeQuotes = quotes.filter(q => q && typeof q === 'object');
  
  if (safeQuotes.length === 0) {
    return {
      totalValue: formatCurrency(0),
      averageValue: formatCurrency(0),
      totalProfit: formatCurrency(0),
      count: 0,
    };
  }
  
  const totalValue = safeQuotes.reduce((sum, quote) => {
    const amount = typeof quote.totalAmount === 'number' ? quote.totalAmount : 0;
    return sum + amount;
  }, 0);
  
  const totalProfit = safeQuotes.reduce((sum, quote) => {
    const profit = typeof quote.estNetProfit === 'number' ? quote.estNetProfit : 0;
    return sum + profit;
  }, 0);
  
  const averageValue = totalValue / safeQuotes.length;
  
  return {
    totalValue: formatCurrency(totalValue),
    averageValue: formatCurrency(averageValue),
    totalProfit: formatCurrency(totalProfit),
    count: safeQuotes.length,
  };
}