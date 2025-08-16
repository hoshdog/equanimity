// src/lib/types.legacy.ts
import { Timestamp } from 'firebase/firestore';

/**
 * This file contains legacy type definitions that are being deprecated.
 * New development should use the provider-agnostic types in `types.ts`.
 * These types are kept temporarily to prevent breaking the UI during the refactor.
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  companyId?: string;
  createdAt: Timestamp;
}

export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    ownerUid: string;
    preferences: {
        themeColor: string;
    }
    createdAt: Timestamp;
}

export interface Customer {
    id: string;
    name: string;
    address: string;
    primaryContactName: string;
    email: string;
    phone: string;
    type: string;
    primaryContactId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  customerId: string;
  customerName?: string; // Denormalized for easy display
  siteId: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  assignedStaff?: AssignedStaff[];
  createdAt: Timestamp;
}

export interface AssignedStaff {
    employeeId: string;
    role: string;
}

export interface ProjectContact {
    contactId: string;
    role: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  primaryContactId: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    duration?: number;
    durationUnit?: 'hours' | 'days' | 'weeks';
}


export interface Revision {
    version: number;
    changedAt: Timestamp;
    changedBy: string; // User ID
    changeSummary: string;
    quoteData: any; // A snapshot of the quote data at this version
}

export interface Attachment {
    name: string;
    url: string;
    uploadedAt: Timestamp;
    uploadedBy: string; // User ID
}

export interface Quote {
    id: string;
    quoteNumber: string;
    name: string;
    description: string;
    quoteDate: Date | Timestamp;
    dueDate: Date | Timestamp;
    expiryDate: Date | Timestamp;
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Invoiced';
    lineItems: QuoteLineItem[];
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    totalAmount: number;
    terms?: string;
    internalNotes?: string;
    clientNotes?: string;
    projectId?: string;
    projectName?: string | null;
    customerId?: string;
    siteId?: string;
    assignedStaff?: AssignedStaff[];
    projectContacts?: ProjectContact[];
    attachments?: Attachment[];
    version: number;
    revisions: Revision[];
    // New optional fields
    likelihood?: number;
    estNetProfit?: number;
    prompt?: string;
    quotingProfileId?: string;
    tasks?: Task[];
    createdAt: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    createdBy?: string;
    updatedBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  role: string;
  employmentType: 'Full-time' | 'Part-time' | 'Casual';
  payType?: 'Hourly' | 'Salary';
  wage?: number;
  annualSalary?: number;
  calculatedCostRate?: number;
  estimatedNonBillableHours?: number;
  award?: string;
  isOverhead?: boolean;
  tfn?: string;
  superannuation?: {
    fundName?: string;
    memberNumber?: string;
  };
  leaveBalances?: {
    annual: number;
    sick: number;
    banked: number;
  };
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierName: string;
    status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
    totalValue: number;
    lineItems: POLineItem[];
    projectId: string;
    projectName?: string;
    customerId?: string;
    createdAt: Timestamp;
}

export interface POLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface QuoteLineItem {
    id: string;
    type: 'Part' | 'Labour';
    partNumber?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unitCost?: number;
    markup?: number;
    taxRate?: number;
}

export interface TimelineItem {
    id: string;
    name: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
    dependencies: string[];
    type: 'job' | 'task';
    jobId?: string;
    isCritical?: boolean;
    assignedResourceIds?: string[];
    conflict?: {
        isConflict: boolean;
        conflictingItems: { itemId: string; projectId: string }[];
    };
    validationError?: string | null;
}

export const jobStaffRoles = [
    "Project Manager",
    "Lead Technician",
    "Technician",
    "Apprentice",
    "Estimator",
    "Safety Officer",
];
