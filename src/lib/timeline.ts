// src/lib/timeline.ts
import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import type { TimelineItem } from './types';

// Get all timeline items for a specific project
export async function getTimelineItems(projectId: string): Promise<TimelineItem[]> {
  const timelineItemsRef = collection(db, 'projects', projectId, 'timelineItems');
  const q = query(timelineItemsRef, orderBy('startDate', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  } as TimelineItem));
}
