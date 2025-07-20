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


// --- Persistent Time Tracking ---

interface TrackingSession {
    id: string;
    userId: string;
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

const sessionsCollection = collection(db, 'trackingSessions');

// Get the current active session for a user (if any)
export async function getActiveTrackingSession(userId: string): Promise<TrackingSession | null> {
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
export async function startTrackingSession(userId: string, context: TrackingSession['context']): Promise<string> {
    // Ensure no other active sessions exist for this user
    const existingSession = await getActiveTrackingSession(userId);
    if (existingSession) {
        throw new Error('An active tracking session already exists.');
    }

    const newSession = {
        userId,
        context,
        startTime: serverTimestamp(),
        status: 'active',
    };
    const docRef = await addDoc(sessionsCollection, newSession);
    return docRef.id;
}

// Stop a tracking session
export async function stopTrackingSession(sessionId: string): Promise<number> {
    const sessionRef = doc(db, 'trackingSessions', sessionId);
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
