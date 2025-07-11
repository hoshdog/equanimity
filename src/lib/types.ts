

import type { OptionType } from "@/components/ui/multi-select";

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
    siteId: string;
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
  contacts: Contact[];
  sites: Site[];
  projects: ProjectSummary[];
}

export interface CustomerDetails {
    [key: string]: Customer;
}

export interface ProjectContact {
    contactId: string;
    role: string;
}

export interface AssignedStaff {
    value: string;
    label: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    assignedStaff: AssignedStaff[];
    customerId: string;
    siteId: string;
    projectContacts: ProjectContact[];
}
