// src/lib/jobs.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  writeBatch,
  query,
  collectionGroup,
} from 'firebase/firestore';
import type { Job } from './types';

// Get all jobs from all projects
export async function getJobs(): Promise<Job[]> {
  const jobsRef = collectionGroup(db, 'jobs');
  const q = query(jobsRef);
  const snapshot = await getDocs(q);
  const jobs: Job[] = [];
  snapshot.forEach(doc => {
      // We need to get the parent project ID from the doc path
      const path = doc.ref.path;
      const pathSegments = path.split('/');
      const projectId = pathSegments[pathSegments.length - 3];
      jobs.push({ id: doc.id, projectId, ...doc.data() } as Job);
  });
  return jobs;
}


// Add a new job to a specific project
export async function addJob(projectId: string, jobData: Omit<Job, 'id' | 'createdAt' | 'projectId'>): Promise<string> {
    const projectRef = doc(db, 'projects', projectId);
    const jobsCollectionRef = collection(projectRef, 'jobs');
    const newJobRef = await addDoc(jobsCollectionRef, jobData);
    return newJobRef.id;
}
