// functions/src/timeline.ts
/**
 * @fileOverview Cloud Functions for validating and processing project timeline data.
 * This includes checks for circular dependencies, resource conflicts, and critical path analysis.
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Assuming a simplified TimelineItem type for backend use.
interface TimelineItem {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    dependencies: string[];
    assignedResourceIds?: string[];
    projectId: string; // Added for cross-project conflict checking
}

/**
 * Utility to detect circular dependencies using Depth First Search (DFS).
 * @param {TimelineItem[]} items - An array of all timeline items for the project.
 * @returns {boolean} - True if a cycle is detected, otherwise false.
 */
function hasCircularDependency(items: TimelineItem[]): boolean {
    const graph = new Map<string, string[]>();
    items.forEach(item => graph.set(item.id, item.dependencies || []));

    const visiting = new Set<string>(); // For nodes currently in the recursion stack
    const visited = new Set<string>();  // For nodes that have been fully explored

    for (const item of items) {
        if (!visited.has(item.id)) {
            if (dfs(item.id, graph, visiting, visited)) {
                return true; // Cycle detected
            }
        }
    }
    return false; // No cycles
}

function dfs(nodeId: string, graph: Map<string, string[]>, visiting: Set<string>, visited: Set<string>): boolean {
    visiting.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighborId of neighbors) {
        if (visiting.has(neighborId)) {
            return true; // Cycle detected (back edge)
        }
        if (!visited.has(neighborId)) {
            if (dfs(neighborId, graph, visiting, visited)) {
                return true;
            }
        }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
}

/**
 * Checks for resource conflicts for a given timeline item across all projects.
 * @param {TimelineItem} currentItem - The item being checked.
 * @param {string} currentItemId - The ID of the item being checked.
 * @param {string} currentProjectId - The project ID of the item being checked.
 * @returns {Promise<object>} - An object with conflict status and conflicting item details.
 */
async function checkResourceConflicts(currentItem: TimelineItem, currentItemId: string, currentProjectId: string) {
    if (!currentItem.assignedResourceIds || currentItem.assignedResourceIds.length === 0) {
        return { isConflict: false, conflictingItems: [] };
    }

    const db = getFirestore();
    const timelineItemsRef = db.collectionGroup('timelineItems');
    
    // Find other items assigned to the same resources.
    const querySnapshot = await timelineItemsRef.where('assignedResourceIds', 'array-contains-any', currentItem.assignedResourceIds).get();

    const conflictingItems: { itemId: string; projectId: string }[] = [];
    const currentStart = new Date(currentItem.startDate);
    const currentEnd = new Date(currentItem.endDate);

    querySnapshot.forEach(doc => {
        const item = doc.data() as TimelineItem;
        const itemId = doc.id;
        // The project ID is on the parent reference
        const projectId = doc.ref.parent.parent!.id; 

        // Skip the item itself
        if (projectId === currentProjectId && itemId === currentItemId) {
            return;
        }

        const itemStart = new Date(item.startDate);
        const itemEnd = new Date(item.endDate);

        // Check for overlapping date ranges
        if (currentStart < itemEnd && currentEnd > itemStart) {
            conflictingItems.push({ itemId, projectId });
        }
    });

    return {
        isConflict: conflictingItems.length > 0,
        conflictingItems,
    };
}


/**
 * Firestore trigger that runs when a timeline item is created or updated.
 * It validates data and checks for dependencies and resource conflicts.
 */
export const onWriteTimelineItem = onDocumentWritten("projects/{projectId}/timelineItems/{itemId}", async (event) => {
    logger.info(`Validating timeline item ${event.params.itemId} for project ${event.params.projectId}`);
    
    const change = event.data;
    if (!change || !change.after.exists) {
        logger.info("Document deleted or no data, exiting.");
        return;
    }

    const db = getFirestore();
    const itemRef = change.after.ref;
    const itemData = change.after.data() as TimelineItem;
    
    const updates: { [key: string]: any } = {};

    // 1. Validate start and end dates
    if (new Date(itemData.startDate) >= new Date(itemData.endDate)) {
        updates.validationError = 'Start date must be before end date.';
    }

    // 2. Check for circular dependencies within the same project
    const projectItemsSnapshot = await itemRef.parent.get();
    const allItems = projectItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineItem));

    if (hasCircularDependency(allItems)) {
        updates.validationError = 'Circular dependency detected.';
    }

    // If there's a validation error from dates or cycles, write it and stop.
    if (updates.validationError) {
        logger.error(`Validation failed for ${event.params.itemId}: ${updates.validationError}`);
        return itemRef.update(updates);
    } else if (itemData.validationError) {
        // Clear any previous validation errors if checks now pass
        updates.validationError = null;
    }
    
    // 3. Check for resource conflicts across all projects
    const conflictResult = await checkResourceConflicts(itemData, event.params.itemId, event.params.projectId);
    updates.conflict = conflictResult;
    if (conflictResult.isConflict) {
        logger.warn(`Resource conflict detected for item ${event.params.itemId}.`);
    }

    logger.info("Timeline item validation successful, writing updates.", { updates });
    return itemRef.update(updates);
});

// The callable function for critical path remains largely the same.
// A full implementation is complex and out of scope for this example.
// ... existing calculateCriticalPath function would go here ...
