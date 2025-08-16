// src/lib/types.ts
import { Timestamp } from 'firebase/firestore';

// =================================================================
// CORE ORGANIZATIONAL & FINANCIAL BLUEPRINT
// =================================================================

export interface Org {
    id: string;
    name: string;
    country: 'AU';
    xeroStatus: {
        connected: boolean;
        tenantId?: string;
        lastSyncAt?: Timestamp;
        scopes?: string[];
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
    tracking?: { // Maps to Xero Tracking Categories
        categoryId: string;
        optionId: string;
    };
    xero?: {
        trackingOptionKey?: string; // Cache the specific name/id for lookups
        invoiceIds: string[];
        billIds: string[];
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
    xero?: {
        contactId?: string;
    };
}

export interface CatalogueItem {
    id: string;
    sku: string;
    name: string;
    uom: string; // Unit of Measure
    defaultAccountCode?: string;
    defaultTaxRateKey?: string;
    xero?: {
        itemId?: string;
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
    xero?: {
        fileId?: string;
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
        itemId?: string; // Link to catalogue
        description: string;
        qty: number;
        unitPrice: number; // Tax exclusive
        accountCode?: string;
        taxIntentKey: string; // Link to tax mapping
        tracking?: { categoryId: string; optionId: string };
    }[];
    totals: {
        subtotal: number;
        tax: number;
        grand: number;
    };
    status: 'DRAFT' | 'POSTED' | 'RECONCILED' | 'VOID';
    ledgerRef?: { // Reference to the created accounting record
        type: 'INVOICE' | 'BILL' | 'JOURNAL';
        id?: string;
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
    taxKey: string; // e.g., 'GST_ON_INCOME_10'
    name: string;
    rate: number;
    jurisdiction: 'AU';
    intent: 'GST_ON_INCOME' | 'GST_FREE' | 'INPUT_TAXED' | 'GST_ON_EXPENSE';
    xeroTaxType?: string;
}

export interface TrackingCategory {
    id: string;
    name: string;
    options: {
        optionId: string;
        label: string;
        jobId?: string; // Link back to the job that created this option
    }[];
    xero?: {
        categoryId?: string;
    };
}

// =================================================================
// SYSTEM & OPERATIONAL TYPES
// =================================================================

export interface XeroToken {
    encAccessToken: string; // Encrypted
    encRefreshToken: string; // Encrypted
    expiresAt: Timestamp;
    scopes: string[];
    updatedAt: Timestamp;
}

export interface AuditEvent {
    actor: string; // User ID or system process name
    action: string; // e.g., 'job.create', 'xero.invoice.post'
    entity: {
        type: string; // e.g., 'job', 'financialIntent'
        id: string;
    };
    before?: object; // Snapshot of data before change
    after?: object; // Snapshot of data after change
    correlationId: string;
    idempotencyKey?: string;
    createdAt: Timestamp;
}

export interface OutboxMessage {
    orgId: string;
    kind: 'XERO_PUSH_FINANCIAL_INTENT' | 'XERO_ATTACH_EVIDENCE' | 'XERO_PULL_REFERENCE_DATA';
    payload: object;
    attempts: number;
    nextRunAt: Timestamp;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARKED';
    history: { status: string; timestamp: Timestamp; error?: string }[];
}

// =================================================================
// USER & LEGACY TYPES (To be phased out or adapted)
// =================================================================

export type OptionType = {
  value: string;
  label: string;
};

export const jobStaffRoles = [
    "Project Manager",
    "Lead Technician",
    "Technician",
    "Apprentice",
    "Estimator",
    "Safety Officer",
];
