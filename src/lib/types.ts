// src/lib/types.ts
import { Timestamp } from 'firebase/firestore';
import type { GenerateQuoteFromPromptOutput, GenerateQuoteFromPromptInput } from '@/ai/flows/generate-quote-from-prompt';
import { JobStatus } from './job-status';

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
  id: string;
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

export interface Job {
    id: string;
    projectId: string;
    projectName: string; // Denormalized
    customerId: string; // Denormalized
    customerName: string; // Denormalized
    description: string;
    status: JobStatus;
    technicianId: string;
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

export interface Quote extends GenerateQuoteFromPromptInput, GenerateQuoteFromPromptOutput {
    id: string;
    customerId: string;
    projectId?: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
    createdAt: Timestamp;
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
