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

const jobsCollection = collection(db, 'jobs');

// Get all jobs, optionally filtered by projectId
export async function getJobs(projectId?: string): Promise<Job[]> {
  const constraints = [orderBy('createdAt', 'desc')];
  if (projectId) {
      constraints.push(where('projectId', '==', projectId));
  }
  const q = query(jobsCollection, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
}


// Add a new job
export async function addJob(jobData: Omit<Job, 'id' | 'createdAt'>): Promise<string> {
    let finalJobData = { ...jobData };

    // If a project is linked, get its details
    if (jobData.projectId) {
        const projectRef = doc(db, 'projects', jobData.projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            finalJobData.projectName = projectData.name;
        }
    }
    
    // Ensure customer name is present
    if (!jobData.customerName) {
         const customerRef = doc(db, 'customers', jobData.customerId);
         const customerSnap = await getDoc(customerRef);
         if (customerSnap.exists()) {
             finalJobData.customerName = (customerSnap.data() as Customer).name;
         }
    }

    const newJobRef = await addDoc(jobsCollection, {
        ...finalJobData,
        // Convert dates to Timestamps if they are Date objects
        startDate: jobData.startDate ? jobData.startDate : null,
        endDate: jobData.endDate ? jobData.endDate : null,
        createdAt: serverTimestamp(),
    });

    // Create a corresponding timeline item if linked to a project
    if (finalJobData.projectId) {
        const timelineItemsRef = collection(db, 'projects', finalJobData.projectId, 'timelineItems');
        await addDoc(timelineItemsRef, {
          name: finalJobData.title,
          type: 'job',
          jobId: newJobRef.id,
          startDate: finalJobData.startDate ? (finalJobData.startDate as Date).toISOString() : new Date().toISOString(),
          endDate: finalJobData.endDate ? (finalJobData.endDate as Date).toISOString() : new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          dependencies: finalJobData.dependencies || [],
          assignedResourceIds: finalJobData.assignedStaff.map(s => s.employeeId),
        });
    }

    return newJobRef.id;
}
