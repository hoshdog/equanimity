// src/lib/employees.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import type { Employee } from './types';


const employeesCollection = collection(db, 'employees');

export async function getEmployees(): Promise<Employee[]> {
  const snapshot = await getDocs(employeesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}
