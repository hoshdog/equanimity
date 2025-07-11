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

export async function getEmployee(id: string): Promise<Employee | null> {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    return null;
}

// A specific function to get employees with wage data for calculations
export async function getEmployeesWithWageData(): Promise<Employee[]> {
    const snapshot = await getDocs(employeesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)).filter(e => e.wage && e.wage > 0);
}
