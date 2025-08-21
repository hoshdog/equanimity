// src/app/scheduling/utils.ts

import { ScheduleEvent } from './data';
import { areIntervalsOverlapping } from 'date-fns';

/**
 * Checks if a proposed event conflicts with any existing events for the same resource.
 * @param newEvent The event to check for conflicts.
 * @param existingEvents An array of all other events.
 * @returns {boolean} True if a conflict is detected, false otherwise.
 */
export function detectConflict(newEvent: ScheduleEvent, existingEvents: ScheduleEvent[]): boolean {
  for (const existingEvent of existingEvents) {
    // Check only against events for the same resource and ignore the event itself if it's being updated
    if (existingEvent.resourceId === newEvent.resourceId && existingEvent.id !== newEvent.id) {
      if (
        areIntervalsOverlapping(
          { start: newEvent.start, end: newEvent.end },
          { start: existingEvent.start, end: existingEvent.end },
          { inclusive: true } // Consider events touching at the edges as overlapping
        )
      ) {
        // A conflict is found
        return true;
      }
    }
  }

  // No conflicts found
  return false;
}
