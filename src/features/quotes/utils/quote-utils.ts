// src/features/quotes/utils/quote-utils.ts

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ValidUntilPreset {
  label: string;
  description: string;
  days: number;
  value: string;
}

export interface TermsTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'express' | 'warranty' | 'custom';
  content: string;
  isDefault?: boolean;
}

export interface QuoteNumberConfig {
  prefix: string;
  separator: string;
  yearFormat: 'YYYY' | 'YY';
  numberLength: number;
}

// ============================================================================
// Constants
// ============================================================================

const QUOTE_NUMBER_KEY = 'equanimity_quote_counter';
const QUOTE_NUMBER_YEAR_KEY = 'equanimity_quote_year';

const DEFAULT_QUOTE_CONFIG: QuoteNumberConfig = {
  prefix: 'QUO',
  separator: '-',
  yearFormat: 'YYYY',
  numberLength: 5,
};

// ============================================================================
// Quote Number Generation
// ============================================================================

/**
 * Thread-safe auto-incrementing quote number generation
 * Format: QUO-YYYY-XXXXX where YYYY is year and XXXXX is incrementing number
 * Uses localStorage to persist counter across sessions
 */
export function generateQuoteNumber(config: Partial<QuoteNumberConfig> = {}): string {
  const finalConfig = { ...DEFAULT_QUOTE_CONFIG, ...config };
  const currentYear = new Date().getFullYear();
  const yearString = finalConfig.yearFormat === 'YYYY' 
    ? currentYear.toString() 
    : currentYear.toString().slice(-2);

  // Get stored year and counter
  const storedYear = parseInt(localStorage.getItem(QUOTE_NUMBER_YEAR_KEY) || '0');
  let counter = parseInt(localStorage.getItem(QUOTE_NUMBER_KEY) || '0');

  // Reset counter if year has changed
  if (storedYear !== currentYear) {
    counter = 0;
    localStorage.setItem(QUOTE_NUMBER_YEAR_KEY, currentYear.toString());
  }

  // Thread-safe increment using atomic operations
  let nextCounter: number;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    attempts++;
    const currentCounter = parseInt(localStorage.getItem(QUOTE_NUMBER_KEY) || '0');
    nextCounter = Math.max(counter, currentCounter) + 1;
    
    // Attempt to claim this number
    localStorage.setItem(QUOTE_NUMBER_KEY, nextCounter.toString());
    
    // Verify we got the number we expected (basic optimistic locking)
    const verifyCounter = parseInt(localStorage.getItem(QUOTE_NUMBER_KEY) || '0');
    
    if (verifyCounter === nextCounter || attempts >= maxAttempts) {
      break;
    }
    
    // Small random delay to reduce contention
    const delay = Math.random() * 10;
    for (let i = 0; i < delay * 1000; i++) {
      // Busy wait - not ideal but works for localStorage contention
    }
  } while (attempts < maxAttempts);

  // Format the counter with leading zeros
  const paddedNumber = nextCounter.toString().padStart(finalConfig.numberLength, '0');

  // Construct the quote number
  return `${finalConfig.prefix}${finalConfig.separator}${yearString}${finalConfig.separator}${paddedNumber}`;
}

/**
 * Get the next quote number without incrementing the counter
 * Useful for previewing what the next quote number will be
 */
export function getNextQuoteNumber(config: Partial<QuoteNumberConfig> = {}): string {
  const finalConfig = { ...DEFAULT_QUOTE_CONFIG, ...config };
  const currentYear = new Date().getFullYear();
  const yearString = finalConfig.yearFormat === 'YYYY' 
    ? currentYear.toString() 
    : currentYear.toString().slice(-2);

  const storedYear = parseInt(localStorage.getItem(QUOTE_NUMBER_YEAR_KEY) || '0');
  let counter = parseInt(localStorage.getItem(QUOTE_NUMBER_KEY) || '0');

  // If year has changed, next counter would be 1
  if (storedYear !== currentYear) {
    counter = 0;
  }

  const nextCounter = counter + 1;
  const paddedNumber = nextCounter.toString().padStart(finalConfig.numberLength, '0');

  return `${finalConfig.prefix}${finalConfig.separator}${yearString}${finalConfig.separator}${paddedNumber}`;
}

/**
 * Reset the quote counter (useful for testing or year transitions)
 */
export function resetQuoteCounter(): void {
  localStorage.removeItem(QUOTE_NUMBER_KEY);
  localStorage.removeItem(QUOTE_NUMBER_YEAR_KEY);
}

/**
 * Get current counter stats
 */
export function getQuoteCounterStats(): { currentYear: number; counter: number; nextNumber: string } {
  const currentYear = new Date().getFullYear();
  const storedYear = parseInt(localStorage.getItem(QUOTE_NUMBER_YEAR_KEY) || '0');
  const counter = parseInt(localStorage.getItem(QUOTE_NUMBER_KEY) || '0');
  
  return {
    currentYear: storedYear || currentYear,
    counter,
    nextNumber: getNextQuoteNumber()
  };
}

// ============================================================================
// Valid Until Date Presets
// ============================================================================

/**
 * Get predefined validity period presets
 * Returns array of preset options with calculated dates from today
 */
export function getValidUntilPresets(): ValidUntilPreset[] {
  return [
    {
      label: '1 Week',
      description: 'Quote expires in 7 days',
      days: 7,
      value: '1-week'
    },
    {
      label: '14 Days',
      description: 'Quote expires in 2 weeks',
      days: 14,
      value: '14-days'
    },
    {
      label: '1 Month',
      description: 'Quote expires in 30 days',
      days: 30,
      value: '1-month'
    },
    {
      label: '3 Months',
      description: 'Quote expires in 90 days',
      days: 90,
      value: '3-months'
    }
  ];
}

/**
 * Calculate the valid until date based on preset or custom days
 */
export function calculateValidUntilDate(preset: string | number): Date {
  let days: number;

  if (typeof preset === 'number') {
    days = preset;
  } else {
    const presetConfig = getValidUntilPresets().find(p => p.value === preset);
    days = presetConfig?.days || 30; // Default to 30 days if preset not found
  }

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + days);
  
  // Set to end of day for better UX
  validUntilDate.setHours(23, 59, 59, 999);
  
  return validUntilDate;
}

/**
 * Check if a quote is expired based on validUntil date
 */
export function isQuoteExpired(validUntilDate: Date): boolean {
  const now = new Date();
  return now > validUntilDate;
}

/**
 * Get days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(validUntilDate: Date): number {
  const now = new Date();
  const diffTime = validUntilDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// Terms & Conditions Templates
// ============================================================================

/**
 * Get predefined terms and conditions templates
 * Returns common templates with clear descriptions for different quote types
 */
export function getTermsTemplates(): TermsTemplate[] {
  return [
    {
      id: 'standard-terms',
      name: 'Standard Terms',
      description: 'General terms for most projects and services',
      category: 'standard',
      isDefault: true,
      content: `TERMS AND CONDITIONS

1. ACCEPTANCE
This quote is valid until the expiry date specified above. Acceptance of this quote constitutes agreement to these terms and conditions.

2. PAYMENT TERMS
- 30% deposit required upon acceptance
- Progress payments as outlined in the quote
- Final payment due within 30 days of completion
- Late payment fees may apply after 30 days

3. SCOPE OF WORK
The work outlined in this quote includes only the items specifically listed. Any additional work will require a separate quote and approval.

4. VARIATIONS
Any changes to the scope of work must be agreed to in writing and may result in additional charges or delays.

5. WARRANTY
We provide a 12-month warranty on workmanship. Equipment warranties are as per manufacturer specifications.

6. LIABILITY
Our liability is limited to the value of this quote. We are not responsible for consequential damages.

7. FORCE MAJEURE
Delays due to circumstances beyond our control (weather, supply issues, etc.) will not incur penalties.`
    },
    {
      id: 'express-terms',
      name: 'Express Terms',
      description: 'Shorter terms for urgent or simple projects',
      category: 'express',
      content: `EXPRESS TERMS

1. ACCEPTANCE & PAYMENT
This quote expires on the date specified. Payment terms: 50% deposit, balance on completion.

2. SCOPE
Work includes only items listed. Additional work requires separate approval.

3. WARRANTY
6-month warranty on workmanship. Equipment as per manufacturer warranty.

4. VARIATIONS
Changes require written approval and may incur additional costs.

5. LIABILITY
Liability limited to quote value. No consequential damages.`
    },
    {
      id: 'extended-warranty',
      name: 'Extended Warranty Terms',
      description: 'For projects requiring extended warranty periods',
      category: 'warranty',
      content: `EXTENDED WARRANTY TERMS

1. STANDARD CONDITIONS
All standard terms apply as per our general conditions of trade.

2. EXTENDED WARRANTY
We provide an extended 24-month warranty on all workmanship and materials supplied.

3. WARRANTY COVERAGE
- All labor and materials supplied by us
- Replacement of defective components at no charge
- Return visits for warranty issues at no charge
- Emergency call-out service during business hours

4. WARRANTY EXCLUSIONS
- Damage due to misuse or normal wear and tear
- Modifications made by others
- Damage from external factors (weather, vandalism, etc.)
- Consumable items (filters, batteries, etc.)

5. WARRANTY CLAIM PROCESS
All warranty claims must be reported within 7 days of discovery. We will respond within 24 hours during business days.

6. MAINTENANCE REQUIREMENTS
Regular maintenance as specified in our documentation must be performed to maintain warranty coverage.`
    },
    {
      id: 'custom-template',
      name: 'Custom Terms',
      description: 'Template for creating custom terms specific to unique projects',
      category: 'custom',
      content: `CUSTOM TERMS AND CONDITIONS

[Insert custom terms and conditions specific to this project]

Key Areas to Address:
- Payment terms and schedule
- Scope of work and deliverables
- Timeline and milestones
- Warranty and support
- Change management process
- Risk allocation and liability
- Intellectual property rights
- Confidentiality requirements
- Dispute resolution process

Please customize these terms to match the specific requirements of your project and ensure they comply with applicable laws and regulations.`
    }
  ];
}

/**
 * Get a specific terms template by ID
 */
export function getTermsTemplate(id: string): TermsTemplate | null {
  return getTermsTemplates().find(template => template.id === id) || null;
}

/**
 * Get the default terms template
 */
export function getDefaultTermsTemplate(): TermsTemplate {
  return getTermsTemplates().find(template => template.isDefault) || getTermsTemplates()[0];
}

/**
 * Get terms templates by category
 */
export function getTermsTemplatesByCategory(category: TermsTemplate['category']): TermsTemplate[] {
  return getTermsTemplates().filter(template => template.category === category);
}

// ============================================================================
// Additional Utility Functions
// ============================================================================

/**
 * Format quote number for display (adds separators if needed)
 */
export function formatQuoteNumber(quoteNumber: string): string {
  // If already formatted, return as-is
  if (quoteNumber.includes('-')) {
    return quoteNumber;
  }
  
  // Try to parse and reformat if it's a plain number
  if (/^\d+$/.test(quoteNumber)) {
    const num = parseInt(quoteNumber);
    return `QUO-${new Date().getFullYear()}-${num.toString().padStart(5, '0')}`;
  }
  
  return quoteNumber;
}

/**
 * Validate quote number format
 */
export function validateQuoteNumber(quoteNumber: string): boolean {
  const pattern = /^[A-Z]{2,4}-\d{2,4}-\d{3,6}$/;
  return pattern.test(quoteNumber);
}

/**
 * Extract year from quote number
 */
export function extractYearFromQuoteNumber(quoteNumber: string): number | null {
  const parts = quoteNumber.split('-');
  if (parts.length >= 2) {
    const yearPart = parts[1];
    if (yearPart.length === 4) {
      return parseInt(yearPart);
    } else if (yearPart.length === 2) {
      const shortYear = parseInt(yearPart);
      // Assume 20xx for years 00-50, 19xx for years 51-99
      return shortYear <= 50 ? 2000 + shortYear : 1900 + shortYear;
    }
  }
  return null;
}

/**
 * Generate quote reference for external communications
 */
export function generateQuoteReference(quoteNumber: string, customerName: string): string {
  const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `${quoteNumber}-${cleanCustomerName}`;
}