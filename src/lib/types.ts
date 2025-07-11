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
  id: string;
  name: string;
  address: string;
  primaryContactId: string;
  projects?: ProjectSummary[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  value: number;
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
export interface CustomerWithSubcollections extends Customer {
    contacts: Contact[];
    sites: Site[];
    projects: ProjectSummary[];
}

export interface CustomerDetails {
    [key: string]: CustomerWithSubcollections;
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
    siteId: string;
    projectContacts: ProjectContact[];
    createdAt: Timestamp;
}

export interface Job {
    id: string;
    projectId: string; // The ID of the project this job belongs to
    description: string;
    status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
    technicianId: string;
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
