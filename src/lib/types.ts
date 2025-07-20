// src/lib/types.ts
import { Timestamp } from 'firebase/firestore';
import type { GenerateQuoteFromPromptOutput, GenerateQuoteFromPromptInput } from '@/ai/flows/generate-quote-from-prompt';

export interface OptionType {
  value: string;
  label: string;
}

export interface Contact {
  id: string;
  name: string;
  emails: string[];
  phones: string[];
  jobTitle?: string;
}

export interface Site {
  id:string;
  name: string;
  address: string;
  primaryContactId: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  type: string;
  primaryContactName: string;
  email: string;
  phone: string;
}

export interface ProjectContact {
    contactId: string;
    role: string;
}

export interface AssignedStaff {
    employeeId: string;
    role: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    assignedStaff: AssignedStaff[];
    customerId: string;
    customerName: string; // Denormalized for easier display
    siteId: string;
    projectContacts: ProjectContact[];
    createdAt: Timestamp;
}

export const jobStaffRoles = ["Lead Technician", "Technician", "Apprentice", "Project Manager", "Safety Officer"];

export interface Job {
    id: string;
    projectId: string;
    projectName: string; // Denormalized
    customerId: string; // Denormalized
    customerName: string; // Denormalized

    // Core Details
    title: string;
    description: string;
    category: string;

    // Scheduling
    startDate?: Date | Timestamp;
    endDate?: Date | Timestamp;
    dependencies?: string[];
    isMilestone?: boolean;
    
    // Assignment
    assignedStaff: AssignedStaff[];
    
    // Status & Priority
    status: 'Draft' | 'Planned' | 'In Progress' | 'On Hold' | 'Completed';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    
    // Financials
    billable: boolean;
    billingRate?: number;
    
    // Meta
    createdAt: Timestamp;
}

export interface UserProfile {
    uid: string; // Firebase Auth UID
    displayName: string;
    email: string;
    phone?: string;
    photoURL?: string;
    companyId?: string; // New field to link to the companies collection
    roles: ('admin' | 'client' | 'contractor' | 'user')[];
    skills?: string[];
    certifications?: Array<{
        name: string;
        expiryDate: string; // ISO 8601 format (YYYY-MM-DD)
    }>;
    createdAt: string; // ISO 8601 format
}

export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    ownerUid: string;
    preferences: {
        themeColor: string;
        // Add other preferences here
    };
    createdAt: Timestamp;
}


export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'On Leave' | 'Inactive';
    wage?: number; // Optional wage for hourly
    annualSalary?: number; // Optional salary for salaried
    payType?: 'Hourly' | 'Salary';
    calculatedCostRate?: number;
    employmentType?: 'Full-time' | 'Part-time' | 'Casual';
    isOverhead?: boolean;
    estimatedNonBillableHours?: number;
    tfn?: string;
    award?: string;
    leaveBalances?: {
        annual: number;
        sick: number;
        banked: number;
    };
    superannuation?: {
        fundName: string;
        memberNumber: string;
    };
}

export interface QuoteLineItem {
    id: string; // For React key
    type: 'Part' | 'Labour';
    description: string;
    quantity: number;
    unitPrice: number; // This is the SELL price
    unitCost?: number; // This is the COST price
    taxRate?: number; // Optional, defaults can be applied
    discount?: number; // Optional
}

export interface Quote {
    id: string;
    quoteNumber: string;
    name: string;
    description: string;
    projectId: string;
    projectName: string; // Denormalized for easier display
    customerId: string;
    quoteDate: Timestamp | Date;
    dueDate: Timestamp | Date;
    expiryDate: Timestamp | Date;
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Invoiced';
    lineItems: QuoteLineItem[];
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    totalAmount: number; // This is the final grand total
    projectContactIds?: string[];
    assignedStaffIds?: string[];
    prompt?: string; // The AI prompt that may have generated it
    // From AI Flow
    lineItemsFromAI?: GenerateQuoteFromPromptOutput['lineItems'];
    quoteText?: string;
    paymentTerms?: string;
    validityTerms?: string;
    internalNotes?: string;
    clientNotes?: string;
    version: number;
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp;
}


export interface POLineItem {
  id: string; // For react key
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  projectId: string;
  projectName: string; // Denormalized
  customerId: string; // Denormalized
  supplierName: string;
  status: 'Draft' | 'Sent' | 'Partially Received' | 'Received' | 'Cancelled';
  lineItems: POLineItem[];
  totalValue: number;
  createdAt: Timestamp;
}

export interface LaborRate {
    employeeType: string;
    standardRate: number; // This is the SELL rate
    calculatedCostRate: number; // This is the calculated COST rate
    overtimeRate: number;
}

export interface StockItem {
    id: string;
    name: string;
    sku: string;
    quantityOnHand: number;
    reorderThreshold: number;
    createdAt: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}

// Scheduling-specific types
export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  projectId?: string;
  jobId?: string;
  type: 'work' | 'leave';
  status: 'confirmed' | 'tentative' | 'pending' | 'approved';
}

export interface ScheduleResource {
  id: string;
  title: string;
}

// Timeline-specific types
export interface TimelineItem {
    id: string;
    name: string;
    type: 'job' | 'task';
    jobId?: string; // Only for tasks
    startDate: string; // ISO string
    endDate: string; // ISO string
    dependencies: string[]; // Array of other timelineItem IDs
    assignedResourceIds?: string[]; // New: Staff assigned
    conflict?: { // New: Conflict info
        isConflict: boolean;
        conflictingItems: { itemId: string; projectId: string }[];
    };
    validationError?: string | null; // For date and dependency validation
    // Optional fields populated by the critical path calculation
    isCritical?: boolean;
    earlyStart?: string;
    earlyFinish?: string;
    lateStart?: string;
    lateFinish?: string;
    slack?: number; // in days
}
