// src/lib/job-status.ts

/**
 * @fileOverview Defines the job status enum and provides helper functions for status transitions.
 */

// Defines the possible statuses for a job.
export enum JobStatus {
  Draft = 'Draft',
  Assigned = 'Assigned',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

// Defines the allowed transitions between statuses.
const allowedTransitions: { [key in JobStatus]: JobStatus[] } = {
  [JobStatus.Draft]: [JobStatus.Assigned],
  [JobStatus.Assigned]: [JobStatus.InProgress],
  [JobStatus.InProgress]: [JobStatus.Completed],
  [JobStatus.Completed]: [], // No transitions out of Completed
};

/**
 * Checks if a transition from a current status to a next status is valid.
 * @param currentStatus The current status of the job.
 * @param nextStatus The desired next status of the job.
 * @returns {boolean} True if the transition is allowed, false otherwise.
 */
export function canTransition(currentStatus: JobStatus, nextStatus: JobStatus): boolean {
  if (!allowedTransitions[currentStatus]) {
    return false;
  }
  return allowedTransitions[currentStatus].includes(nextStatus);
}

/**
 * Gets a list of valid next statuses from a given current status.
 * @param currentStatus The current status of the job.
 * @returns {JobStatus[]} An array of allowed next statuses.
 */
export function getValidNextStatuses(currentStatus: JobStatus): JobStatus[] {
  return allowedTransitions[currentStatus] || [];
}

/**
 * Provides an array of all possible job statuses for use in UI components like dropdowns.
 */
export const allJobStatuses: JobStatus[] = [
    JobStatus.Draft,
    JobStatus.Assigned,
    JobStatus.InProgress,
    JobStatus.Completed,
];
