// src/lib/types.ts
import { Timestamp } from 'firebase/firestore';

// =================================================================
// CORE ORGANIZATIONAL & FINANCIAL BLUEPRINT (Provider-Agnostic)
// =================================================================

export interface Org {
    id: string;
    name: string;
    country: 'AU';
    accounting: {
        provider: 'xero' | 'myob' | null;
        status: 'connected' | 'disconnected' | 'error';
        tenantOrFileId: string | null; // Xero: tenantId, MYOB: Company File GUID
        scopes: string[];
        lastSyncAt?: Timestamp;
    };
}

export interface Job {
    id: string;
    code: string; // e.g., JOB-2024-001
    name: string;
    status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
    customerId: string;
    budget: {
        revenue: number;
        cost: number;
    };
    providerRef?: {
        xero?: { categoryId: string; optionId: string; };
        myob?: { jobUid: string; categoryUid?: string; };
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Contact {
    id: string;
    type: 'CUSTOMER' | 'SUPPLIER';
    displayName: string;
    abn?: string;
    addresses: { type: 'PHYSICAL' | 'MAILING'; line1: string; city: string; region: string; postalCode: string; country: string }[];
    emails: { type: 'PRIMARY' | 'BILLING' | 'OTHER'; address: string }[];
    phones: { type: 'MOBILE' | 'OFFICE' | 'DIRECT'; number: string }[];
    providerRef?: {
        xero?: { contactId: string; };
        myob?: { contactUid: string; };
    };
}

export interface CatalogueItem {
    id: string;
    sku: string;
    name: string;
    uom: string; // Unit of Measure
    defaultAccountCode?: string;
    defaultTaxRateKey?: string;
    providerRef?: {
        xero?: { itemId: string; };
        myob?: { itemUid: string; };
    };
}

export interface Document {
    id: string;
    type: 'QUOTE' | 'PURCHASE_ORDER' | 'DELIVERY_DOCKET' | 'TIMESHEET' | 'EVIDENCE_PHOTO';
    jobId: string;
    storagePath: string; // Full path in Firebase Storage
    sha256: string;
    metadata: {
        fileName: string;
        contentType: string;
        contentLength: number;
    };
    providerFileRef?: {
        xero?: { fileId: string; };
        myob?: { attachmentUid: string; };
    };
    createdBy: string; // User ID
    createdAt: Timestamp;
}

export interface FinancialIntent {
    id: string;
    source: 'JOB' | 'PURCHASE_ORDER' | 'TIMESHEET' | 'ADHOC';
    direction: 'INCOME' | 'EXPENSE';
    jobId: string;
    contactId: string;
    lines: {
        itemId?: string;
        description: string;
        qty: number;
        unitPrice: number; // Tax exclusive
        accountCode?: string;
        taxIntentKey: string;
        trackingKey?: string; // Links to the Job ID for tracking purposes
    }[];
    totals: {
        subtotal: number;
        tax: number;
        grand: number;
    };
    status: 'DRAFT' | 'POSTED' | 'RECONCILED' | 'VOID';
    ledgerRef?: { // Reference to the created accounting record
        provider: 'xero' | 'myob';
        type: 'INVOICE' | 'BILL' | 'JOURNAL';
        id?: string;
        url?: string;
    };
    idempotencyKey: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}


// =================================================================
// MAPPING & CONFIGURATION TABLES
// =================================================================

export interface GLAccount {
    accountCode: string;
    name: string;
    type: 'REVENUE' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';
    active: boolean;
}

export interface TaxRateMap {
    taxKey: string;
    name: string;
    rate: number;
    jurisdiction: 'AU';
    intent: 'GST_ON_INCOME' | 'GST_FREE' | 'INPUT_TAXED' | 'GST_ON_EXPENSE';
    providerRef?: {
        xero?: { taxType: string };
        myob?: { taxCodeUid: string };
    };
}

export interface TrackingCategory {
    id: string; // This will be the Job ID
    name: string; // This will be the Job Name
    providerRef?: {
        xero?: { categoryId: string; optionId: string; };
        myob?: { jobUid: string; categoryUid?: string; };
    };
}


// =================================================================
// AUTH & TOKENS
// =================================================================

export interface AccountingTokenSet {
    encAccessToken: string; // Encrypted
    encRefreshToken: string; // Encrypted
    tenantOrFileId: string;
    expiresAt: Date | Timestamp;
    scopes: string[];
    updatedAt?: Timestamp;
}

// =================================================================
// SYSTEM & OPERATIONAL TYPES
// =================================================================

export interface AuditEvent {
    actor: string;
    action: string;
    entity: {
        type: string;
        id: string;
    };
    provider?: 'xero' | 'myob';
    before?: object;
    after?: object;
    correlationId: string;
    idempotencyKey?: string;
    createdAt: Timestamp;
}

export interface OutboxMessage {
    orgId: string;
    kind: 'ACCOUNTING_PUSH' | 'ACCOUNTING_ATTACH' | 'ACCOUNTING_SYNC';
    provider: 'xero' | 'myob';
    payload: object;
    attempts: number;
    nextRunAt: Timestamp;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARKED';
    history: { status: string; timestamp: Timestamp; error?: string }[];
}

// =================================================================
// LEGACY & UI HELPER TYPES
// =================================================================

export type { UserProfile, Company } from './types.legacy';
export type { Quote, PurchaseOrder, Employee, Site, TimelineItem, POLineItem, QuoteLineItem, AssignedStaff, ProjectContact, Attachment, Revision, Task } from './types.legacy';
export { jobStaffRoles } from './types.legacy';
export type OptionType = {
  value: string;
  label: string;
};

// This was moved from quoting-profiles.ts to be more generic
export interface LaborRate {
    employeeType: string;
    standardRate: number; // This is the SELL rate
    calculatedCostRate: number; // This is the calculated COST rate
    overtimeRate: number;
}
