// src/app/scheduling/data.ts
import { addDays, startOfWeek } from 'date-fns';

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  projectId?: string;
  jobId?: string;
  type: 'work' | 'leave';
  status: 'confirmed' | 'tentative' | 'pending' | 'approved';
}

export interface Resource {
  id: string;
  title: string;
}

export interface Project {
  id: string;
  title: string;
}

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

export const mockResources: Resource[] = [
  { id: 'res-1', title: 'Bob Smith' },
  { id: 'res-2', title: 'Charlie Brown' },
  { id: 'res-3', title: 'Fiona Glenanne' },
  { id: 'res-4', title: 'Hannah Montana' },
];

export const mockProjects: Project[] = [
  { id: 'proj-1', title: 'Website Redesign' },
  { id: 'proj-2', title: 'New Apartment Complex Wiring' },
  { id: 'proj-3', title: 'Hawkins High CCTV Upgrade' },
];

export const mockEvents: ScheduleEvent[] = [
  // Bob Smith's week
  { id: 'event-1', resourceId: 'res-1', projectId: 'proj-2', jobId: 'job-1', title: 'Run conduit', start: weekStart, end: addDays(weekStart, 1), type: 'work', status: 'confirmed' },
  { id: 'event-2', resourceId: 'res-1', projectId: 'proj-2', jobId: 'job-2', title: 'Pull cabling', start: addDays(weekStart, 2), end: addDays(weekStart, 2), type: 'work', status: 'confirmed' },
  { id: 'event-3', resourceId: 'res-1', title: 'Dentist Appointment', start: addDays(weekStart, 3), end: addDays(weekStart, 3), type: 'leave', status: 'approved' },
  
  // Charlie Brown's week
  { id: 'event-4', resourceId: 'res-2', projectId: 'proj-3', jobId: 'job-3', title: 'Install cameras', start: addDays(weekStart, 1), end: addDays(weekStart, 3), type: 'work', status: 'confirmed' },
  { id: 'event-5', resourceId: 'res-2', title: 'Sick Day', start: addDays(weekStart, 4), end: addDays(weekStart, 4), type: 'leave', status: 'approved' },
  
  // Fiona's week
  { id: 'event-6', resourceId: 'res-3', projectId: 'proj-1', jobId: 'job-4', title: 'Frontend components', start: weekStart, end: addDays(weekStart, 4), type: 'work', status: 'confirmed' },
  { id: 'event-7', resourceId: 'res-3', title: 'Vacation', start: addDays(weekStart, 5), end: addDays(weekStart, 6), type: 'leave', status: 'approved' },

  // Hannah's week
  { id: 'event-8', resourceId: 'res-4', projectId: 'proj-3', jobId: 'job-5', title: 'Assist with CCTV', start: addDays(weekStart, 1), end: addDays(weekStart, 2), type: 'work', status: 'tentative' },
  { id: 'event-9', resourceId: 'res-4', title: 'Training Day', start: addDays(weekStart, 3), end: addDays(weekStart, 3), type: 'work', status: 'confirmed' },
  { id: 'event-10', resourceId: 'res-4', title: 'Leave Request', start: addDays(weekStart, 4), end: addDays(weekStart, 4), type: 'leave', status: 'pending' },
];
