// functions/src/timeline.ts
/**
 * @fileOverview Cloud Functions for validating and processing project timeline data.
 * This includes checks for circular dependencies and critical path analysis.
 */

import { onDocumentWritten, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";

interface TimelineItem {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    dependencies: string[];
}

/**
 * Utility to detect circular dependencies using Depth First Search (DFS).
 * @param {TimelineItem[]} items - An array of all timeline items for the project.
 * @returns {boolean} - True if a cycle is detected, otherwise false.
 */
function hasCircularDependency(items: TimelineItem[]): boolean {
    const graph = new Map<string, string[]>();
    items.forEach(item => graph.set(item.id, item.dependencies));

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
            // A neighbor is in the current recursion stack, which means we have a back edge (a cycle).
            return true;
        }
        if (!visited.has(neighborId)) {
            if (dfs(neighborId, graph, visiting, visited)) {
                return true;
            }
        }
    }

    visiting.delete(nodeId); // Remove from recursion stack
    visited.add(nodeId);   // Mark as fully explored
    return false;
}


/**
 * Firestore trigger that runs when a timeline item is created or updated.
 * It validates date consistency and checks for circular dependencies.
 */
export const onUpdateTimelineItem = onDocumentUpdated("projects/{projectId}/timelineItems/{itemId}", async (event) => {
    logger.info(`Validating timeline item for project ${event.params.projectId}`);
    
    const db = getFirestore();
    const projectRef = db.collection('projects').doc(event.params.projectId);
    const timelineItemsRef = projectRef.collection('timelineItems');

    const itemData = event.data?.after.data() as TimelineItem;

    // 1. Validate start and end dates
    if (new Date(itemData.startDate) >= new Date(itemData.endDate)) {
        logger.error("Validation failed: startDate must be before endDate.");
        // Optional: Add an error field to the document
        return event.data?.after.ref.update({ 'validationError': 'Start date must be before end date.' });
    }

    // 2. Check for circular dependencies
    const allItemsSnapshot = await timelineItemsRef.get();
    const allItems = allItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineItem));

    if (hasCircularDependency(allItems)) {
        logger.error("Validation failed: A circular dependency was detected in the project timeline.");
        return event.data?.after.ref.update({ 'validationError': 'Circular dependency detected.' });
    }
    
    // Clear any previous error if validation passes
    if (itemData.validationError) {
        return event.data?.after.ref.update({ 'validationError': null });
    }

    logger.info("Timeline item validation successful.");
    return null;
});


/**
 * Callable Cloud Function to calculate the critical path of a project.
 * NOTE: This is a placeholder. A full implementation requires a complex graph algorithm (like PERT).
 */
export const calculateCriticalPath = async (data: { projectId: string }) => {
    const { projectId } = data;
    if (!projectId) {
        logger.error("Missing projectId in call to calculateCriticalPath.");
        throw new Error("Missing projectId.");
    }
    
    logger.info(`Calculating critical path for project: ${projectId}`);
    
    //
    // --- THIS IS A COMPLEX ALGORITHM ---
    // A full implementation of PERT (Program Evaluation and Review Technique) would:
    // 1. Fetch all timeline items.
    // 2. Build a directed acyclic graph (DAG) from the items and their dependencies.
    // 3. Perform a forward pass to calculate Earliest Start (ES) and Earliest Finish (EF) for each item.
    // 4. Perform a backward pass to calculate Latest Start (LS) and Latest Finish (LF).
    // 5. Calculate "slack" or "float" (LS - ES).
    // 6. Items with zero slack are on the critical path.
    // 7. Update all items in Firestore with these new fields (`isCritical`, `slack`, etc.).
    //
    
    const db = getFirestore();
    const timelineItemsRef = db.collection('projects').doc(projectId).collection('timelineItems');
    const allItemsSnapshot = await timelineItemsRef.get();
    
    // **Placeholder Logic**: Mark the longest task as critical for demonstration.
    let longestItem: TimelineItem | null = null;
    let maxDuration = -1;

    allItemsSnapshot.docs.forEach(doc => {
        const item = doc.data() as TimelineItem;
        const duration = new Date(item.endDate).getTime() - new Date(item.startDate).getTime();
        if (duration > maxDuration) {
            maxDuration = duration;
            longestItem = { id: doc.id, ...item };
        }
    });

    const batch = db.batch();
    allItemsSnapshot.docs.forEach(doc => {
        const isCritical = doc.id === longestItem?.id;
        batch.update(doc.ref, { isCritical });
    });

    await batch.commit();

    return {
        success: true,
        message: "Critical path calculation complete (using placeholder logic).",
        criticalPathItems: longestItem ? [longestItem.id] : [],
    };
};
