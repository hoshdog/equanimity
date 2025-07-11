// src/lib/types.ts
import { Timestamp } from 'firebase/firestore';

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
    value: string; // Employee ID
    label: string; // Employee Name
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

export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'On Leave' | 'Inactive';
}
