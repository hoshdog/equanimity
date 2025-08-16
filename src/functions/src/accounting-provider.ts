// src/functions/src/accounting-provider.ts
/**
 * @fileOverview Defines the core interface for an accounting provider and related types.
 * This abstraction allows the application to interact with different accounting systems (like Xero or MYOB)
 * through a consistent API.
 */

import type { FinancialIntent, AccountingTokenSet, GLAccount, TaxRateMap, TrackingCategory } from './types';
import { xeroAdapter } from './xero-adapter';
import { myobAdapter } from './myob-adapter';


export interface PullReferenceDataResult {
    accounts: GLAccount[];
    taxRates: TaxRateMap[];
    trackingCategories: TrackingCategory[];
}

export interface PushResult {
    id: string;
    url?: string;
}

export interface AttachmentResult {
    attachmentId: string;
}

/**
 * Defines the contract for an accounting provider adapter.
 * Each provider (Xero, MYOB) will have a concrete implementation of this interface.
 */
export interface AccountingProvider {
    name: 'xero' | 'myob';

    /**
     * Authentication-related methods.
     */
    auth: {
        startAuth(orgId: string): Promise<URL>;
        handleRedirect(code: string, state: string): Promise<{ tokenSet: AccountingTokenSet, orgId: string, tenantOrFileId: string }>;
        refresh(tokenSet: AccountingTokenSet): Promise<AccountingTokenSet>;
    };

    /**
     * Fetches core reference data from the provider.
     * This is used to populate mapping tables.
     */
    pullReferenceData(tokenSet: AccountingTokenSet, tenantOrFileId: string): Promise<PullReferenceDataResult>;

    /**
     * Pushes a financial intent to the provider, creating an invoice.
     */
    pushInvoice(tokenSet: AccountingTokenSet, tenantOrFileId: string, intent: FinancialIntent): Promise<PushResult>;

    /**
     * Pushes a financial intent to the provider, creating a bill.
     */
    pushBill(tokenSet: AccountingTokenSet, tenantOrFileId: string, intent: FinancialIntent): Promise<PushResult>;

    /**
     * Attaches a file to a specific resource (invoice, bill) in the provider's system.
     */
    attach(tokenSet: AccountingTokenSet, tenantOrFileId: string, resourceId: string, file: { name: string; bytes: Buffer; sha256: string }): Promise<AttachmentResult>;
    
    /**
     * Fetches a list of changes (e.g., payments) since a given timestamp.
     * This is crucial for providers that don't support webhooks for all events (like MYOB).
     */
    listChanges(tokenSet: AccountingTokenSet, tenantOrFileId: string, since: Date, filters?: any): Promise<any[]>;
}

/**
 * A factory function to select the appropriate provider adapter.
 * @param providerName The name of the provider ('xero' or 'myob').
 * @returns An instance of the AccountingProvider interface.
 */
export function selectProvider(providerName: 'xero' | 'myob'): AccountingProvider {
    switch (providerName) {
        case 'xero':
            return xeroAdapter;
        case 'myob':
            return myobAdapter;
        default:
            throw new Error(`Unsupported accounting provider: ${providerName}`);
    }
}
