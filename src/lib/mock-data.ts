// Comprehensive mock data system for local development
// This provides realistic data for all entities in the system

import { Timestamp } from 'firebase/firestore';
import type { Contact, Site } from './types';

// Helper to create mock timestamps
const mockTimestamp = (daysAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return Timestamp.fromDate(date);
};

// Mock Customers/Contacts
export const mockCustomers = [
  {
    id: 'cust-001',
    displayName: 'ABC Construction Pty Ltd',
    type: 'CUSTOMER',
    abn: '12345678901',
    addresses: [
      {
        type: 'PHYSICAL' as const,
        line1: '123 Builder Street',
        city: 'Sydney',
        region: 'NSW',
        postalCode: '2000',
        country: 'Australia'
      }
    ],
    emails: [
      {
        type: 'WORK' as const,
        address: 'contact@abcconstruction.com.au'
      }
    ],
    phones: [
      {
        type: 'WORK' as const,
        number: '+61 2 9876 5432'
      }
    ],
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(5)
  },
  {
    id: 'cust-002',
    displayName: 'XYZ Plumbing Services',
    type: 'CUSTOMER',
    abn: '98765432109',
    addresses: [
      {
        type: 'PHYSICAL' as const,
        line1: '456 Pipe Lane',
        city: 'Melbourne',
        region: 'VIC',
        postalCode: '3000',
        country: 'Australia'
      }
    ],
    emails: [
      {
        type: 'WORK' as const,
        address: 'info@xyzplumbing.com.au'
      }
    ],
    phones: [
      {
        type: 'WORK' as const,
        number: '+61 3 9123 4567'
      }
    ],
    createdAt: mockTimestamp(60),
    updatedAt: mockTimestamp(10)
  },
  {
    id: 'cust-003',
    displayName: 'Green Energy Solutions',
    type: 'CUSTOMER',
    abn: '11223344556',
    addresses: [
      {
        type: 'PHYSICAL' as const,
        line1: '789 Solar Avenue',
        city: 'Brisbane',
        region: 'QLD',
        postalCode: '4000',
        country: 'Australia'
      }
    ],
    emails: [
      {
        type: 'WORK' as const,
        address: 'sales@greenenergy.com.au'
      }
    ],
    phones: [
      {
        type: 'WORK' as const,
        number: '+61 7 3456 7890'
      }
    ],
    createdAt: mockTimestamp(45),
    updatedAt: mockTimestamp(2)
  }
];

// Mock Sites
export const mockSites: Site[] = [
  {
    id: 'site-001',
    customerId: 'cust-001',
    name: 'Main Office',
    address: '123 Business Street',
    suburb: 'Sydney',
    state: 'NSW',
    postalCode: '2000',
    country: 'Australia',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'site-002',
    customerId: 'cust-001',
    name: 'Warehouse A',
    address: '456 Industrial Road',
    suburb: 'Alexandria',
    state: 'NSW',
    postalCode: '2015',
    country: 'Australia',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'site-003',
    customerId: 'cust-002',
    name: 'Regional Office',
    address: '789 Corporate Drive',
    suburb: 'Melbourne',
    state: 'VIC',
    postalCode: '3000',
    country: 'Australia',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

// Mock Projects
export const mockProjects = [
  {
    id: 'proj-001',
    code: 'PRJ-2024-001',
    name: 'Sydney Office Renovation',
    description: 'Complete office renovation including electrical and plumbing work',
    customerId: 'cust-001',
    customerName: 'ABC Construction Pty Ltd',
    status: 'In Progress' as const,
    budgetCost: 150000,
    budgetSell: 225000,
    actualCost: 75000,
    actualSell: 112500,
    startDate: mockTimestamp(30),
    endDate: mockTimestamp(-30), // 30 days in future
    createdAt: mockTimestamp(35),
    updatedAt: mockTimestamp(1)
  },
  {
    id: 'proj-002',
    code: 'PRJ-2024-002',
    name: 'Melbourne Warehouse Fit-out',
    description: 'New warehouse electrical and data cabling installation',
    customerId: 'cust-002',
    customerName: 'XYZ Plumbing Services',
    status: 'Planning' as const,
    budgetCost: 85000,
    budgetSell: 127500,
    actualCost: 0,
    actualSell: 0,
    startDate: mockTimestamp(-7), // 7 days in future
    endDate: mockTimestamp(-60), // 60 days in future
    createdAt: mockTimestamp(14),
    updatedAt: mockTimestamp(3)
  },
  {
    id: 'proj-003',
    code: 'PRJ-2024-003',
    name: 'Solar Panel Installation',
    description: 'Commercial solar panel installation and grid connection',
    customerId: 'cust-003',
    customerName: 'Green Energy Solutions',
    status: 'Completed' as const,
    budgetCost: 200000,
    budgetSell: 280000,
    actualCost: 195000,
    actualSell: 275000,
    startDate: mockTimestamp(90),
    endDate: mockTimestamp(15),
    createdAt: mockTimestamp(95),
    updatedAt: mockTimestamp(15)
  },
  {
    id: 'proj-004',
    code: 'PRJ-2024-004',
    name: 'Emergency Repair Works',
    description: 'Emergency electrical repairs after storm damage',
    customerId: 'cust-001',
    customerName: 'ABC Construction Pty Ltd',
    status: 'On Hold' as const,
    budgetCost: 25000,
    budgetSell: 37500,
    actualCost: 12000,
    actualSell: 18000,
    startDate: mockTimestamp(10),
    endDate: mockTimestamp(-14),
    createdAt: mockTimestamp(12),
    updatedAt: mockTimestamp(4)
  }
];

// Mock Jobs
export const mockJobs = [
  {
    id: 'job-001',
    code: 'JOB-2024-001',
    name: 'Electrical Wiring - Level 1',
    description: 'Install electrical wiring for level 1 offices',
    projectId: 'proj-001',
    projectName: 'Sydney Office Renovation',
    status: 'In Progress' as const,
    assignedTo: ['emp-001', 'emp-002'],
    budgetHours: 120,
    actualHours: 65,
    startDate: mockTimestamp(20),
    endDate: mockTimestamp(-10),
    createdAt: mockTimestamp(30),
    updatedAt: mockTimestamp(0)
  },
  {
    id: 'job-002',
    code: 'JOB-2024-002',
    name: 'Plumbing Installation',
    description: 'Install new plumbing for bathrooms and kitchen',
    projectId: 'proj-001',
    projectName: 'Sydney Office Renovation',
    status: 'Planning' as const,
    assignedTo: ['emp-003'],
    budgetHours: 80,
    actualHours: 0,
    startDate: mockTimestamp(-5),
    endDate: mockTimestamp(-20),
    createdAt: mockTimestamp(25),
    updatedAt: mockTimestamp(2)
  },
  {
    id: 'job-003',
    code: 'JOB-2024-003',
    name: 'Data Cabling Installation',
    description: 'Install CAT6 cabling throughout warehouse',
    projectId: 'proj-002',
    projectName: 'Melbourne Warehouse Fit-out',
    status: 'Planning' as const,
    assignedTo: ['emp-001', 'emp-004'],
    budgetHours: 160,
    actualHours: 0,
    startDate: mockTimestamp(-7),
    endDate: mockTimestamp(-30),
    createdAt: mockTimestamp(14),
    updatedAt: mockTimestamp(3)
  },
  {
    id: 'job-004',
    code: 'JOB-2024-004',
    name: 'Solar Panel Mounting',
    description: 'Mount and secure solar panels on roof',
    projectId: 'proj-003',
    projectName: 'Solar Panel Installation',
    status: 'Completed' as const,
    assignedTo: ['emp-002', 'emp-003', 'emp-004'],
    budgetHours: 200,
    actualHours: 195,
    startDate: mockTimestamp(85),
    endDate: mockTimestamp(60),
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(15)
  }
];

// Mock Employees
export const mockEmployees = [
  {
    id: 'emp-001',
    name: 'John Smith',
    displayName: 'John Smith',
    email: 'john.smith@trackle.local',
    role: 'Electrician',
    status: 'Active',
    department: 'Field Services',
    employeeNumber: 'E001',
    startDate: mockTimestamp(365),
    phones: [{ type: 'MOBILE' as const, number: '+61 411 111 111' }],
    emergencyContact: {
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '+61 411 222 222'
    },
    createdAt: mockTimestamp(365),
    updatedAt: mockTimestamp(5)
  },
  {
    id: 'emp-002',
    name: 'Sarah Johnson',
    displayName: 'Sarah Johnson',
    email: 'sarah.johnson@trackle.local',
    role: 'Senior Electrician',
    status: 'Active',
    department: 'Field Services',
    employeeNumber: 'E002',
    startDate: mockTimestamp(730),
    phones: [{ type: 'MOBILE' as const, number: '+61 422 333 333' }],
    emergencyContact: {
      name: 'Mike Johnson',
      relationship: 'Partner',
      phone: '+61 422 444 444'
    },
    createdAt: mockTimestamp(730),
    updatedAt: mockTimestamp(10)
  },
  {
    id: 'emp-003',
    name: 'Michael Brown',
    displayName: 'Michael Brown',
    email: 'michael.brown@trackle.local',
    role: 'Plumber',
    status: 'Active',
    department: 'Field Services',
    employeeNumber: 'E003',
    startDate: mockTimestamp(180),
    phones: [{ type: 'MOBILE' as const, number: '+61 433 555 555' }],
    emergencyContact: {
      name: 'Lisa Brown',
      relationship: 'Wife',
      phone: '+61 433 666 666'
    },
    createdAt: mockTimestamp(180),
    updatedAt: mockTimestamp(3)
  },
  {
    id: 'emp-004',
    name: 'Emma Wilson',
    displayName: 'Emma Wilson',
    email: 'emma.wilson@trackle.local',
    role: 'Apprentice Electrician',
    status: 'On Leave',
    department: 'Field Services',
    employeeNumber: 'E004',
    startDate: mockTimestamp(90),
    phones: [{ type: 'MOBILE' as const, number: '+61 444 777 777' }],
    emergencyContact: {
      name: 'David Wilson',
      relationship: 'Father',
      phone: '+61 444 888 888'
    },
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(7)
  }
];

// Mock Quotes
export const mockQuotes = [
  {
    id: 'quote-001',
    quoteNumber: 'QUO-2024-001',
    code: 'QUO-2024-001',
    name: 'Office Renovation Quote',
    projectId: 'proj-001',
    projectName: 'Sydney Office Renovation',
    customerId: 'cust-001',
    customerName: 'ABC Construction Pty Ltd',
    status: 'APPROVED' as const,
    totalAmount: 225000,
    estNetProfit: 45000,
    likelihood: 95,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
    validUntil: mockTimestamp(-30),
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    updatedAt: mockTimestamp(35)
  },
  {
    id: 'quote-002',
    quoteNumber: 'QUO-2024-002',
    code: 'QUO-2024-002',
    name: 'Warehouse Fit-out Quote',
    projectId: 'proj-002',
    projectName: 'Melbourne Warehouse Fit-out',
    customerId: 'cust-002',
    customerName: 'XYZ Plumbing Services',
    status: 'PENDING' as const,
    totalAmount: 127500,
    estNetProfit: 25500,
    likelihood: 75,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
    validUntil: mockTimestamp(-14),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: mockTimestamp(5)
  },
  {
    id: 'quote-003',
    quoteNumber: 'QUO-2024-003',
    code: 'QUO-2024-003',
    name: 'Additional Solar Panels',
    projectName: 'Solar Panel Installation',
    customerId: 'cust-003',
    customerName: 'Green Energy Solutions',
    status: 'DRAFT' as const,
    totalAmount: 45000,
    estNetProfit: 9000,
    likelihood: 60,
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days in future
    validUntil: mockTimestamp(-21),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: mockTimestamp(1)
  }
];

// Mock Purchase Orders
export const mockPurchaseOrders = [
  {
    id: 'po-001',
    code: 'PO-2024-001',
    supplier: 'Electrical Supplies Co',
    projectId: 'proj-001',
    status: 'APPROVED' as const,
    totalAmount: 35000,
    orderDate: mockTimestamp(25),
    expectedDelivery: mockTimestamp(15),
    createdAt: mockTimestamp(25),
    updatedAt: mockTimestamp(20)
  },
  {
    id: 'po-002',
    code: 'PO-2024-002',
    supplier: 'Plumbing Warehouse',
    projectId: 'proj-001',
    status: 'PENDING' as const,
    totalAmount: 18500,
    orderDate: mockTimestamp(10),
    expectedDelivery: mockTimestamp(5),
    createdAt: mockTimestamp(10),
    updatedAt: mockTimestamp(8)
  }
];

// Mock Timesheets
export const mockTimesheets = [
  {
    id: 'ts-001',
    employeeId: 'emp-001',
    employeeName: 'John Smith',
    date: mockTimestamp(0),
    jobId: 'job-001',
    jobName: 'Electrical Wiring - Level 1',
    hours: 8,
    status: 'APPROVED' as const,
    notes: 'Completed wiring for offices 101-105',
    createdAt: mockTimestamp(0),
    updatedAt: mockTimestamp(0)
  },
  {
    id: 'ts-002',
    employeeId: 'emp-002',
    employeeName: 'Sarah Johnson',
    date: mockTimestamp(0),
    jobId: 'job-001',
    jobName: 'Electrical Wiring - Level 1',
    hours: 7.5,
    status: 'PENDING' as const,
    notes: 'Installed power outlets in conference room',
    createdAt: mockTimestamp(0),
    updatedAt: mockTimestamp(0)
  },
  {
    id: 'ts-003',
    employeeId: 'emp-003',
    employeeName: 'Michael Brown',
    date: mockTimestamp(1),
    jobId: 'job-002',
    jobName: 'Plumbing Installation',
    hours: 8,
    status: 'APPROVED' as const,
    notes: 'Prepared plumbing layout plans',
    createdAt: mockTimestamp(1),
    updatedAt: mockTimestamp(1)
  }
];

// Mock data service to simulate Firebase
export class MockDataService {
  private static instance: MockDataService;
  
  static getInstance() {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  async getCustomers() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockCustomers;
  }

  async addCustomer(customer: Contact) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    mockCustomers.push(customer);
    return customer;
  }

  async addSite(site: Site) {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockSites.push(site);
    return site;
  }

  async getSites() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockSites;
  }

  async addQuote(quote: any) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Ensure quote has proper structure with safe defaults
    const newQuote = {
      ...quote,
      id: quote.id || `quote-${Date.now()}`,
      quoteNumber: quote.quoteNumber || quote.name || `QUO-${new Date().getFullYear()}-${(mockQuotes.length + 1).toString().padStart(5, '0')}`,
      // Ensure numeric fields have safe defaults
      totalAmount: typeof quote.totalAmount === 'number' ? quote.totalAmount : 0,
      estNetProfit: typeof quote.estNetProfit === 'number' ? quote.estNetProfit : 0,
      likelihood: typeof quote.likelihood === 'number' ? quote.likelihood : null,
      // Ensure required fields
      status: quote.status || 'DRAFT',
      createdAt: quote.createdAt || new Date(),
      updatedAt: quote.updatedAt || new Date(),
    };
    mockQuotes.push(newQuote);
    return newQuote;
  }

  async updateQuote(quoteId: string, updates: any) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockQuotes.findIndex((q: any) => q.id === quoteId);
    if (index !== -1) {
      // Ensure numeric fields have safe defaults when updating
      const safeUpdates = {
        ...updates,
        totalAmount: typeof updates.totalAmount === 'number' ? updates.totalAmount : mockQuotes[index].totalAmount || 0,
        estNetProfit: typeof updates.estNetProfit === 'number' ? updates.estNetProfit : mockQuotes[index].estNetProfit || 0,
        likelihood: typeof updates.likelihood === 'number' ? updates.likelihood : mockQuotes[index].likelihood,
        updatedAt: new Date(),
      };
      
      mockQuotes[index] = {
        ...mockQuotes[index],
        ...safeUpdates,
      };
      return mockQuotes[index];
    }
    throw new Error('Quote not found');
  }

  async getProjects() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProjects;
  }

  async getJobs() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockJobs;
  }

  async getEmployees() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockEmployees;
  }

  async getQuotes() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockQuotes;
  }

  async getPurchaseOrders() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPurchaseOrders;
  }

  async getTimesheets() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTimesheets;
  }

  // Get by ID methods
  async getCustomerById(id: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockCustomers.find(c => c.id === id);
  }

  async getProjectById(id: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockProjects.find(p => p.id === id);
  }

  async getJobById(id: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockJobs.find(j => j.id === id);
  }

  async getEmployeeById(id: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockEmployees.find(e => e.id === id);
  }

  // Filter methods
  async getProjectsByStatus(status: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.filter(p => p.status === status);
  }

  async getJobsByProject(projectId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockJobs.filter(j => j.projectId === projectId);
  }

  async getTimesheetsByEmployee(employeeId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTimesheets.filter(t => t.employeeId === employeeId);
  }

  async addProject(projectData: any): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Generate a unique project ID
    const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find customer name for the project
    const customer = mockCustomers.find(c => c.id === projectData.customerId);
    const customerName = customer?.displayName || 'Unknown Customer';
    
    // Generate project code
    const projectCode = `PRJ-${new Date().getFullYear()}-${(mockProjects.length + 1).toString().padStart(3, '0')}`;
    
    // Create new project with required fields
    const newProject = {
      ...projectData,
      id: newProjectId,
      code: projectCode,
      customerName,
      status: 'Planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'mock_user',
      siteId: projectData.siteId || 'default_site' // Add required siteId field
    };
    
    // Add to mock projects array
    mockProjects.unshift(newProject as any);
    
    return newProjectId;
  }
}

// Export singleton instance
export const mockDataService = MockDataService.getInstance();