// src/lib/jobs.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Job, Project, Customer } from './types';


// Get all jobs for a specific organization.
export async function getJobs(orgId: string): Promise<Job[]> {
    const jobsCollection = collection(db, 'orgs', orgId, 'jobs');
    const q = query(jobsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}


// Get all jobs for a specific project
export async function getJobsForProject(orgId: string, projectId: string): Promise<Job[]> {
  const jobsCollection = collection(db, 'orgs', orgId, 'jobs');
  const q = query(jobsCollection, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}


// Add a new job
export async function addJob(orgId: string, jobData: Omit<Job, 'id' | 'createdAt' | 'code' | 'updatedAt' >): Promise<string> {
    const jobsCollection = collection(db, 'orgs', orgId, 'jobs');
    const newJobRef = await addDoc(jobsCollection, {
        ...jobData,
        code: `JOB-${Date.now().toString().slice(-5)}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return newJobRef.id;
}
