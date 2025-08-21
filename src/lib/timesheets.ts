// src/lib/timesheets.ts
import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  Timestamp,
  limit,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { auth } from './auth';

interface TimesheetEntry {
    userId: string;
    orgId: string;
    date: Date;
    durationHours: number;
    notes: string;
    jobId: string;
    isBillable: boolean;
}

export async function addTimesheetEntry(entry: TimesheetEntry): Promise<string> {
    const timesheetsCollection = collection(db, 'orgs', entry.orgId, 'timesheets');
    const docRef = await addDoc(timesheetsCollection, {
        ...entry,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}


// --- Persistent Time Tracking ---

interface TrackingSession {
    id: string;
    userId: string;
    orgId: string;
    context: {
        type: 'project' | 'quote' | 'job';
        id: string;
        name: string;
    };
    startTime: Timestamp;
    endTime?: Timestamp;
    durationSeconds?: number;
    status: 'active' | 'paused';
}

// Get the current active session for a user
export async function getActiveTrackingSession(userId: string): Promise<TrackingSession | null> {
    const sessionsCollection = collection(db, 'trackingSessions'); // This could be org-scoped too
    const q = query(
        sessionsCollection,
        where('userId', '==', userId),
        where('status', '==', 'active'),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TrackingSession;
}


// Start a new tracking session
export async function startTrackingSession(orgId: string, userId: string, context: TrackingSession['context']): Promise<string> {
    const sessionsCollection = collection(db, 'orgs', orgId, 'trackingSessions');
    const existingSession = await getActiveTrackingSession(userId);
    if (existingSession) {
        throw new Error('An active tracking session already exists.');
    }

    const newSession = {
        userId,
        orgId,
        context,
        startTime: serverTimestamp(),
        status: 'active',
    };
    const docRef = await addDoc(sessionsCollection, newSession);
    return docRef.id;
}

// Stop a tracking session
export async function stopTrackingSession(orgId: string, sessionId: string): Promise<number> {
    const sessionRef = doc(db, 'orgs', orgId, 'trackingSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
        throw new Error('Session not found.');
    }

    const sessionData = sessionSnap.data();
    const startTime = (sessionData.startTime as Timestamp).toDate();
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await updateDoc(sessionRef, {
        status: 'paused',
        endTime: Timestamp.fromDate(endTime),
        durationSeconds: durationSeconds,
    });

    return durationSeconds;
}
