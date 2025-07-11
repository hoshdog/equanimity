// src/lib/customers.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
} from 'firebase/firestore';
import type { Customer, Site, Contact, ProjectSummary } from './types';

// Main Customers collection
const customersCollection = collection(db, 'customers');

// Get a list of all customers
export async function getCustomers(): Promise<Customer[]> {
  const snapshot = await getDocs(customersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
}

// Get a single customer document by ID
export async function getCustomer(id: string): Promise<Customer | null> {
  const docRef = doc(db, 'customers', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Customer;
  }
  return null;
}

// Get subcollections for a customer
export async function getCustomerSites(customerId: string): Promise<Site[]> {
    const sitesRef = collection(db, 'customers', customerId, 'sites');
    const snapshot = await getDocs(sitesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
}

export async function getCustomerContacts(customerId: string): Promise<Contact[]> {
    const contactsRef = collection(db, 'customers', customerId, 'contacts');
    const snapshot = await getDocs(contactsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}

export async function getCustomerProjects(customerId: string): Promise<ProjectSummary[]> {
    // In a real app, you might query the main 'projects' collection
    // For now, we'll assume a subcollection if it exists or an empty array
    const projectsRef = collection(db, 'customers', customerId, 'projects');
    const snapshot = await getDocs(projectsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectSummary));
}


// Add a new customer and their initial contact/site
export async function addCustomer(customerData: Omit<Customer, 'id'>, initialContact: Omit<Contact, 'id'>, initialSite: Omit<Site, 'id' | 'primaryContactId'>) {
    const batch = writeBatch(db);

    // 1. Create the customer document
    const customerRef = doc(collection(db, 'customers'));
    batch.set(customerRef, customerData);

    // 2. Create the initial contact document
    const contactRef = doc(collection(db, 'customers', customerRef.id, 'contacts'));
    batch.set(contactRef, initialContact);
    
    // 3. Create the initial site document, linking the new contact
    const siteRef = doc(collection(db, 'customers', customerRef.id, 'sites'));
    batch.set(siteRef, { ...initialSite, primaryContactId: contactRef.id });

    await batch.commit();

    return { customerId: customerRef.id, contactId: contactRef.id, siteId: siteRef.id };
}

// Update a customer
export async function updateCustomer(id: string, data: Partial<Customer>) {
  const docRef = doc(db, 'customers', id);
  await updateDoc(docRef, data);
}

// Delete a customer (and ideally their subcollections in a real app)
export async function deleteCustomer(id: string) {
  // This just deletes the customer doc. Deleting subcollections requires more complex logic,
  // often handled by a Cloud Function to ensure atomicity.
  const docRef = doc(db, 'customers', id);
  await deleteDoc(docRef);
}

// Add a site to a customer
export async function addSite(customerId: string, siteData: Omit<Site, 'id'>) {
    const sitesRef = collection(db, 'customers', customerId, 'sites');
    const newSiteRef = await addDoc(sitesRef, siteData);
    return newSiteRef.id;
}

// Add a contact to a customer
export async function addContact(customerId: string, contactData: Omit<Contact, 'id'>) {
    const contactsRef = collection(db, 'customers', customerId, 'contacts');
    const newContactRef = await addDoc(contactsRef, contactData);
    return newContactRef.id;
}

// Add a project to a customer's subcollection (for summary view)
export async function addProjectToCustomer(customerId: string, projectData: Omit<ProjectSummary, 'id'>) {
    const projectsRef = collection(db, 'customers', customerId, 'projects');
    const newProjectRef = await addDoc(projectsRef, projectData);
    return newProjectRef.id;
}
