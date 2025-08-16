// src/lib/employees.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  query,
} from 'firebase/firestore';
import type { Employee } from './types';


export async function getEmployees(orgId: string): Promise<Employee[]> {
  const employeesCollection = collection(db, 'orgs', orgId, 'employees');
  const snapshot = await getDocs(employeesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
}

export async function getEmployee(orgId: string, id: string): Promise<Employee | null> {
    const docRef = doc(db, 'orgs', orgId, 'employees', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    return null;
}

export async function addEmployee(orgId: string, employeeData: Omit<Employee, 'id'>): Promise<string> {
    const employeesCollection = collection(db, 'orgs', orgId, 'employees');
    const newEmployeeRef = await addDoc(employeesCollection, {
        ...employeeData,
        createdAt: serverTimestamp(),
    });
    return newEmployeeRef.id;
}

export async function updateEmployee(orgId: string, id: string, employeeData: Partial<Omit<Employee, 'id' | 'createdAt'>>) {
    const employeeDocRef = doc(db, 'orgs', orgId, 'employees', id);
    await updateDoc(employeeDocRef, employeeData);
}

export async function deleteEmployee(orgId: string, id: string) {
    const employeeDocRef = doc(db, 'orgs', orgId, 'employees', id);
    await deleteDoc(employeeDocRef);
}


// A specific function to get employees with wage data for calculations
export async function getEmployeesWithWageData(orgId: string): Promise<Employee[]> {
    const employeesCollection = collection(db, 'orgs', orgId, 'employees');
    const q = query(employeesCollection); // Can add where clauses if needed
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)).filter(e => e.wage || e.annualSalary);
}
