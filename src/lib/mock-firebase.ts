// Mock Firebase functionality for local development
// This intercepts Firebase calls and returns mock data

import { mockDataService } from './mock-data';

// Check if we're in mock mode
const USE_MOCK_DATA = process.env.ENABLE_MOCK_DATA === 'true' || 
                      process.env.MIGRATION_MODE === 'true' ||
                      process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('INVALID');

// Mock Firebase collection function
export function mockCollection(db: any, ...pathSegments: string[]) {
  const collectionPath = pathSegments.join('/');
  return {
    path: collectionPath,
    type: 'collection'
  };
}

// Mock Firebase query function
export function mockQuery(collection: any, ...constraints: any[]) {
  return {
    collection,
    constraints,
    type: 'query'
  };
}

// Mock Firebase where function
export function mockWhere(field: string, operator: string, value: any) {
  return {
    field,
    operator,
    value,
    type: 'where'
  };
}

// Mock Firebase onSnapshot function
export function mockOnSnapshot(
  query: any,
  onNext: (snapshot: any) => void,
  onError?: (error: Error) => void
) {
  // Extract collection type from query
  let collectionType = 'unknown';
  
  if (query.collection?.path) {
    const path = query.collection.path;
    if (path.includes('contacts') || path.includes('customers')) {
      collectionType = 'customers';
    } else if (path.includes('projects')) {
      collectionType = 'projects';
    } else if (path.includes('jobs')) {
      collectionType = 'jobs';
    } else if (path.includes('employees')) {
      collectionType = 'employees';
    } else if (path.includes('quotes')) {
      collectionType = 'quotes';
    } else if (path.includes('purchaseOrders')) {
      collectionType = 'purchaseOrders';
    } else if (path.includes('timesheets')) {
      collectionType = 'timesheets';
    }
  }

  // Fetch mock data based on collection type
  const fetchData = async () => {
    try {
      let data: any[] = [];
      
      switch (collectionType) {
        case 'customers':
          data = await mockDataService.getCustomers();
          // Apply where constraints if any
          if (query.constraints) {
            query.constraints.forEach((constraint: any) => {
              if (constraint.type === 'where' && constraint.field === 'type' && constraint.value === 'CUSTOMER') {
                // Already filtered in mock data
              }
            });
          }
          break;
        case 'projects':
          data = await mockDataService.getProjects();
          break;
        case 'jobs':
          data = await mockDataService.getJobs();
          break;
        case 'employees':
          data = await mockDataService.getEmployees();
          break;
        case 'quotes':
          data = await mockDataService.getQuotes();
          break;
        case 'purchaseOrders':
          data = await mockDataService.getPurchaseOrders();
          break;
        case 'timesheets':
          data = await mockDataService.getTimesheets();
          break;
        default:
          console.warn(`Unknown collection type: ${collectionType}`);
          data = [];
      }

      // Create mock snapshot
      const snapshot = {
        docs: data.map(item => ({
          id: item.id,
          data: () => item,
          exists: () => true
        })),
        empty: data.length === 0,
        size: data.length
      };

      // Call the callback with mock snapshot
      onNext(snapshot);
    } catch (error) {
      console.error('Error fetching mock data:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Fetch data immediately
  fetchData();

  // Return unsubscribe function
  return () => {
    // Cleanup if needed
  };
}

// Mock Firebase getDocs function
export async function mockGetDocs(query: any) {
  let data: any[] = [];
  
  // Determine collection type from query
  const path = query.collection?.path || query.path || '';
  
  if (path.includes('contacts') || path.includes('customers')) {
    data = await mockDataService.getCustomers();
  } else if (path.includes('projects')) {
    data = await mockDataService.getProjects();
  } else if (path.includes('jobs')) {
    data = await mockDataService.getJobs();
  } else if (path.includes('employees')) {
    data = await mockDataService.getEmployees();
  } else if (path.includes('quotes')) {
    data = await mockDataService.getQuotes();
  } else if (path.includes('purchaseOrders')) {
    data = await mockDataService.getPurchaseOrders();
  } else if (path.includes('timesheets')) {
    data = await mockDataService.getTimesheets();
  }

  // Apply constraints if any
  if (query.constraints) {
    query.constraints.forEach((constraint: any) => {
      if (constraint.type === 'where') {
        data = data.filter(item => {
          const fieldValue = item[constraint.field];
          switch (constraint.operator) {
            case '==':
              return fieldValue === constraint.value;
            case '!=':
              return fieldValue !== constraint.value;
            case 'in':
              return constraint.value.includes(fieldValue);
            default:
              return true;
          }
        });
      }
    });
  }

  return {
    docs: data.map(item => ({
      id: item.id,
      data: () => item,
      exists: () => true
    })),
    empty: data.length === 0,
    size: data.length
  };
}

// Mock Firebase getDoc function
export async function mockGetDoc(docRef: any) {
  const pathParts = docRef.path?.split('/') || [];
  const id = pathParts[pathParts.length - 1];
  const collectionName = pathParts[pathParts.length - 2];
  
  let data = null;
  
  if (collectionName === 'contacts' || collectionName === 'customers') {
    data = await mockDataService.getCustomerById(id);
  } else if (collectionName === 'projects') {
    data = await mockDataService.getProjectById(id);
  } else if (collectionName === 'jobs') {
    data = await mockDataService.getJobById(id);
  } else if (collectionName === 'employees') {
    data = await mockDataService.getEmployeeById(id);
  }
  
  return {
    id: data?.id,
    data: () => data,
    exists: () => !!data
  };
}

// Mock Firebase addDoc function
export async function mockAddDoc(collection: any, data: any) {
  // Generate a mock ID
  const id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // In a real implementation, this would save to localStorage or a mock backend
  console.log('Mock addDoc:', { collection: collection.path, id, data });
  
  return {
    id,
    path: `${collection.path}/${id}`
  };
}

// Mock Firebase updateDoc function
export async function mockUpdateDoc(docRef: any, data: any) {
  console.log('Mock updateDoc:', { path: docRef.path, data });
  // In a real implementation, this would update localStorage or a mock backend
  return Promise.resolve();
}

// Mock Firebase deleteDoc function
export async function mockDeleteDoc(docRef: any) {
  console.log('Mock deleteDoc:', { path: docRef.path });
  // In a real implementation, this would delete from localStorage or a mock backend
  return Promise.resolve();
}

// Export functions that switch between real and mock based on environment
export function getFirebaseFunctions() {
  if (USE_MOCK_DATA) {
    return {
      collection: mockCollection,
      query: mockQuery,
      where: mockWhere,
      onSnapshot: mockOnSnapshot,
      getDocs: mockGetDocs,
      getDoc: mockGetDoc,
      addDoc: mockAddDoc,
      updateDoc: mockUpdateDoc,
      deleteDoc: mockDeleteDoc
    };
  }
  
  // Return real Firebase functions
  const firebase = require('firebase/firestore');
  return {
    collection: firebase.collection,
    query: firebase.query,
    where: firebase.where,
    onSnapshot: firebase.onSnapshot,
    getDocs: firebase.getDocs,
    getDoc: firebase.getDoc,
    addDoc: firebase.addDoc,
    updateDoc: firebase.updateDoc,
    deleteDoc: firebase.deleteDoc
  };
}