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
  const q = query(customersCollection); // TODO: Add where('type', '==', 'CUSTOMER') when data model is updated
  const snapshot = await getDocs(q);
  // This needs adaptation to the new `Contact` model.
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Customer));
}

// Get a single customer document by ID for a specific organization
export async function getCustomer(orgId: string, customerId: string): Promise<Customer | null> {
  const docRef = doc(db, 'orgs', orgId, 'contacts', customerId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    // This needs adaptation to the new `Contact` model.
    return { id: docSnap.id, ...docSnap.data() } as unknown as Customer;
  }
  return null;
}

// Get subcollections for a customer
export async function getCustomerSites(orgId: string, customerId: string): Promise<Site[]> {
    // Sites might be stored under the contact or at the org level. Assuming org level for now.
    const sitesRef = collection(db, 'orgs', orgId, 'sites');
    const q = query(sitesRef); // TODO: Add where('contactId', '==', customerId)
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
}

export async function getCustomerContacts(orgId: string, customerId: string): Promise<Contact[]> {
    // This function is slightly redundant now. It should fetch contacts related to a primary contact.
    // For now, it will fetch all contacts in the org.
    const contactsRef = collection(db, 'orgs', orgId, 'contacts');
    const snapshot = await getDocs(contactsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
}


// Add a new customer
export async function addCustomer(orgId: string, customerData: Partial<Contact>): Promise<{ customerId: string }> {
    const batch = writeBatch(db);
    const contactsCollection = collection(db, 'orgs', orgId, 'contacts');
    const customerRef = doc(contactsCollection);
    
    batch.set(customerRef, {
        ...customerData,
        type: 'CUSTOMER',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    await batch.commit();

    return { customerId: customerRef.id };
}


// Update a customer
export async function updateCustomer(orgId: string, customerId: string, data: Partial<Contact>) {
  const docRef = doc(db, 'orgs', orgId, 'contacts', customerId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

// Delete a customer
export async function deleteCustomer(orgId: string, customerId: string) {
  const docRef = doc(db, 'orgs', orgId, 'contacts', customerId);
  await deleteDoc(docRef);
}

// Add a site to a customer (or organization, more likely)
export async function addSite(orgId: string, siteData: Omit<Site, 'id'>): Promise<string> {
    const sitesRef = collection(db, 'orgs', orgId, 'sites');
    const newSiteRef = await addDoc(sitesRef, siteData);
    return newSiteRef.id;
}

// Add a contact person to a customer
export async function addContact(orgId: string, customerId: string, contactData: Partial<Contact>): Promise<string> {
    // This logic might change. Is a "contact" a person under a company, or is the company the contact?
    // Assuming we're adding a new person contact here.
    const contactsRef = collection(db, 'orgs', orgId, 'contacts', customerId, 'people');
    const newContactRef = await addDoc(contactsRef, contactData);
    return newContactRef.id;
}
