// src/lib/timesheets.ts
import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

interface TimesheetEntry {
    userId: string;
    date: Date;
    durationHours: number;
    notes: string;
    jobId: string; // Could be a project ID, quote ID, or a special value like 'TRAINING'
    isBillable: boolean;
}

export async function addTimesheetEntry(entry: TimesheetEntry): Promise<string> {
    const timesheetsCollection = collection(db, 'timesheets');
    const docRef = await addDoc(timesheetsCollection, {
        ...entry,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}
