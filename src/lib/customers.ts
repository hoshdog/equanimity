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
import type { Contact, Customer, Site } from './types';


// Get a list of all customers for a specific organization
export async function getCustomers(orgId: string): Promise<Customer[]> {
  const customersCollection = collection(db, 'orgs', orgId, 'contacts');
  const q = query(customersCollection);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
}

// Get a single customer document by ID for a specific organization
export async function getCustomer(orgId: string, customerId: string): Promise<Customer | null> {
  const docRef = doc(db, 'orgs', orgId, 'contacts', customerId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Customer;
  }
  return null;
}

// Get subcollections for a customer
export async function getCustomerSites(orgId: string, customerId: string): Promise<Site[]> {
    const sitesRef = collection(db, 'orgs', orgId, 'contacts', customerId, 'sites');
    const snapshot = await getDocs(sitesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
}

export async function getCustomerContacts(orgId: string, customerId: string): Promise<Contact[]> {
    const contactsRef = collection(db, 'orgs', orgId, 'contacts', customerId, 'persons');
    const snapshot = await getDocs(contactsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}


// Add a new customer and their initial contact/site
export async function addCustomer(orgId: string, customerData: Omit<Customer, 'id'>, initialContact: Omit<Contact, 'id'>, initialSite: Omit<Site, 'id' | 'primaryContactId'>) {
    const batch = writeBatch(db);

    // 1. Create the customer document
    const customerRef = doc(collection(db, 'orgs', orgId, 'contacts'));

    // 2. Create the initial contact person document
    const contactRef = doc(collection(db, 'orgs', orgId, 'contacts', customerRef.id, 'persons'));
    batch.set(contactRef, initialContact);
    
    // 3. Set the customer document with the ID of the new primary contact
    batch.set(customerRef, { ...customerData, primaryContactId: contactRef.id });

    // 4. Create the initial site document, linking the new contact
    const siteRef = doc(collection(db, 'orgs', orgId, 'contacts', customerRef.id, 'sites'));
    batch.set(siteRef, { ...initialSite, primaryContactId: contactRef.id });

    await batch.commit();

    return { customerId: customerRef.id, contactId: contactRef.id, siteId: siteRef.id };
}


// Update a customer
export async function updateCustomer(orgId: string, customerId: string, data: Partial<Customer>) {
  const docRef = doc(db, 'orgs', orgId, 'contacts', customerId);
  await updateDoc(docRef, data);
}

// Delete a customer
export async function deleteCustomer(orgId: string, customerId: string) {
  const docRef = doc(db, 'orgs', orgId, 'contacts', customerId);
  await deleteDoc(docRef);
}

// Add a site to a customer
export async function addSite(orgId: string, customerId: string, siteData: Omit<Site, 'id'>): Promise<string> {
    const sitesRef = collection(db, 'orgs', orgId, 'contacts', customerId, 'sites');
    const newSiteRef = await addDoc(sitesRef, siteData);
    return newSiteRef.id;
}

// Add a contact to a customer
export async function addContact(orgId: string, customerId: string, contactData: Omit<Contact, 'id'>): Promise<string> {
    const contactsRef = collection(db, 'orgs', orgId, 'contacts', customerId, 'persons');
    const newContactRef = await addDoc(contactsRef, contactData);
    return newContactRef.id;
}
