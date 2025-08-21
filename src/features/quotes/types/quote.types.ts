// src/features/quotes/types/quote.types.ts
export interface QuoteFormData {
  // Step 1: Customer & Project
  customerId: string;
  siteId?: string;
  projectId?: string;
  quoteType: 'new-project' | 'existing-project' | 'maintenance' | 'consultation';
  priority: 'standard' | 'urgent' | 'low';

  // Step 2: Configuration
  name: string;
  description?: string;
  validUntil: Date;
  deliveryDate?: Date;
  quotingProfileId: string;
  projectContacts: ProjectContact[];
  assignedStaff: AssignedStaff[];

  // Step 3: Line Items
  lineItems: QuoteLineItem[];
  discounts: QuoteDiscount[];
  taxSettings: TaxConfiguration;
  terms?: string;
  notes?: string;

  // Step 4: Review & Send
  status: QuoteStatus;
  deliveryMethod?: 'email' | 'pdf-download' | 'print';
  emailRecipients?: string[];
  scheduledSendDate?: Date;
}

export interface QuoteLineItem {
  id: string;
  type: 'product' | 'service' | 'labor';
  itemCode?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountPercent?: number;
  taxRate: number;
  subtotal: number;
  total: number;
  sortOrder: number;
  category?: string;
  notes?: string;
}

export interface QuoteDiscount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  appliedTo: 'subtotal' | 'labor' | 'materials' | 'specific-items';
  itemIds?: string[];
}

export interface TaxConfiguration {
  defaultRate: number;
  includeTaxInPrices: boolean;
  taxLabel: string;
  taxNumber?: string;
  customRates?: {
    category: string;
    rate: number;
  }[];
}

export interface ProjectContact {
  contactId: string;
  role: string;
  isPrimary: boolean;
  notificationPreferences?: {
    quoteCreated: boolean;
    quoteUpdated: boolean;
    quoteApproved: boolean;
  };
}

export interface AssignedStaff {
  employeeId: string;
  role: string;
  estimatedHours?: number;
  hourlyRate?: number;
  isLead: boolean;
}

export type QuoteStatus = 
  | 'draft' 
  | 'pending-review' 
  | 'sent' 
  | 'viewed' 
  | 'approved' 
  | 'rejected' 
  | 'expired' 
  | 'revised';

export interface QuoteRevision {
  id: string;
  quoteId: string;
  revisionNumber: number;
  createdAt: Date;
  createdBy: string;
  changes: QuoteChange[];
  notes?: string;
}

export interface QuoteChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  changedBy: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  defaultLineItems: Partial<QuoteLineItem>[];
  defaultTerms?: string;
  defaultValidityDays: number;
  defaultTaxSettings: TaxConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteCalculations {
  subtotal: number;
  totalDiscounts: number;
  totalTax: number;
  totalAmount: number;
  totalCost?: number;
  totalProfit?: number;
  profitMargin?: number;
  laborTotal?: number;
  materialsTotal?: number;
  breakdown?: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}