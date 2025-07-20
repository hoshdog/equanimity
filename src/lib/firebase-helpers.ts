// This file is a placeholder for fetching data in a more structured way.
// In a real application, these functions might live in separate files
// like `lib/projects.ts` or `lib/customers.ts` and could include
// more complex logic like caching or error handling.

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Project, Customer } from './types';

export async function getProjects(): Promise<Project[]> {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

export async function getCustomers(): Promise<Customer[]> {
    const q = query(collection(db, 'customers'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
}
