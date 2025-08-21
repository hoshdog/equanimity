'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Contact, Site, Project, Employee } from '@/lib/types';

interface QuoteFormContextValue {
  // Data
  customers: Contact[];
  sites: Site[];
  projects: Project[];
  employees: Employee[];
  contacts: Contact[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCustomerData: (customerId: string) => Promise<void>;
  addCustomer: (customer: Contact) => Promise<void>;
  addSite: (site: Site) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  refreshData: () => Promise<void>;
}

const QuoteFormContext = createContext<QuoteFormContextValue | undefined>(undefined);

export function QuoteFormProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  React.useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load customers from mock data service
      const { mockDataService } = await import('@/lib/mock-data');
      const [customersData, sitesData, projectsData, employeesData] = await Promise.all([
        mockDataService.getCustomers(),
        mockDataService.getSites(),
        mockDataService.getProjects(),
        mockDataService.getEmployees(),
      ]);
      
      setCustomers(customersData);
      setSites(sitesData);
      setProjects(projectsData);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCustomerData = useCallback(async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Load sites and projects for the specific customer
      const { mockDataService } = await import('@/lib/mock-data');
      const [sitesData, projectsData] = await Promise.all([
        mockDataService.getSites(),
        mockDataService.getProjects(),
      ]);
      
      // Filter data for the specific customer
      const customerSites = sitesData.filter((site: any) => site.customerId === customerId);
      const customerProjects = projectsData.filter((project: any) => project.customerId === customerId);
      
      // Update the state with customer-specific data
      setSites(customerSites);
      setProjects(customerProjects);
      
      console.log(`Loaded ${customerSites.length} sites and ${customerProjects.length} projects for customer:`, customerId);
    } catch (err) {
      console.error('Failed to load customer data:', err);
      setError('Failed to load customer data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCustomer = useCallback(async (customer: Contact) => {
    try {
      // In a real app, this would save to the database
      setCustomers(prev => [...prev, customer]);
    } catch (err) {
      console.error('Failed to add customer:', err);
      throw err;
    }
  }, []);

  const addSite = useCallback(async (site: Site) => {
    try {
      const { mockDataService } = await import('@/lib/mock-data');
      await mockDataService.addSite(site);
      setSites(prev => [...prev, site]);
    } catch (err) {
      console.error('Failed to add site:', err);
      throw err;
    }
  }, []);

  const addProject = useCallback(async (project: Project) => {
    try {
      const { mockDataService } = await import('@/lib/mock-data');
      await mockDataService.addProject(project);
      setProjects(prev => [...prev, project]);
    } catch (err) {
      console.error('Failed to add project:', err);
      throw err;
    }
  }, []);

  const addContact = useCallback(async (contact: Contact) => {
    try {
      // In a real app, this would save to the database
      setContacts(prev => [...prev, contact]);
    } catch (err) {
      console.error('Failed to add contact:', err);
      throw err;
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const value: QuoteFormContextValue = {
    customers,
    sites,
    projects,
    employees,
    contacts,
    isLoading,
    error,
    loadCustomerData,
    addCustomer,
    addSite,
    addProject,
    addContact,
    refreshData,
  };

  return (
    <QuoteFormContext.Provider value={value}>
      {children}
    </QuoteFormContext.Provider>
  );
}

export function useQuoteFormContext() {
  const context = useContext(QuoteFormContext);
  if (!context) {
    throw new Error('useQuoteFormContext must be used within QuoteFormProvider');
  }
  return context;
}