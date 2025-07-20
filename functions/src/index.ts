// functions/src/index.ts
/**
 * @fileOverview Firebase Cloud Functions for the Equanimity application.
 *
 * This file contains the core function triggers for user management and integrations with OneDrive and Microsoft Teams.
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest, HttpsOptions, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { 
    getGraphClient, 
    getDeltaChanges, 
    createFolderInTeamsChannel,
    driveItemToFirestore,
} from './graph-helper';
import { onWriteTimelineItem } from './timeline';


// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const requestOptions: HttpsOptions = { cors: true, enforceAppCheck: false };

/**
 * =================================================================
 * Counters and Code Generation
 * =================================================================
 */

async function getNextSequence(entityType: string, year: number): Promise<string> {
    const counterRef = db.collection('counters').doc(entityType);
    let sequence = 1;

    await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists) {
            transaction.set(counterRef, { [`_${year}`]: sequence });
        } else {
            const data = counterDoc.data();
            sequence = (data?.[`_${year}`] || 0) + 1;
            transaction.update(counterRef, { [`_${year}`]: sequence });
        }
    });

    return sequence.toString().padStart(3, '0');
}


export const generateProjectCode = onDocumentCreated("projects/{projectId}", async (event) => {
    const year = new Date().getFullYear();
    const seq = await getNextSequence('projects', year);
    const projectCode = `PRJ-${year}-${seq}`;
    return event.data.ref.update({ projectCode });
});

export const generateQuoteCode = onDocumentCreated("quotes/{quoteId}", async (event) => {
    const year = new Date().getFullYear();
    const seq = await getNextSequence('quotes', year);
    const quoteNumber = `QUO-${year}-${seq}`;
    return event.data.ref.update({ quoteNumber });
});


/**
 * =================================================================
 * Timeline Functions
 * =================================================================
 */
exports.onWriteTimelineItem = onWriteTimelineItem;
exports.calculateCriticalPath = onCall(async () => { /* Placeholder */ });


/**
 * =================================================================
 * USER MANAGEMENT FUNCTIONS
 * =================================================================
 */

/**
 * Creates a user profile document in Firestore whenever a new user signs up.
 */
export const createuserprofile = onUserCreate((event) => {
  const user = event.data;
  const { uid, email } = user;

  logger.info(`New user signed up: ${uid}, Email: ${email}`);

  const userProfile = {
    uid,
    email,
    displayName: email?.split('@')[0] || 'New User',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
    roles: ['user', 'client'],
  };
  
  return db.collection('users').doc(uid).set(userProfile)
    .then(() => {
        logger.info(`Successfully created profile for user: ${uid}`);
        return null;
    })
    .catch((error) => {
        logger.error(`Error creating profile for user: ${uid}`, error);
        return null;
    });
});


/**
 * =================================================================
 * ONEDRIVE INTEGRATION FUNCTIONS (USER-DELEGATED)
 * =================================================================
 */
// Placeholder for OneDrive logic, which is more complex and not part of this change.


/**
 * =================================================================
 * TEAMS INTEGRATION FUNCTIONS (APPLICATION)
 * =================================================================
 */

/**
 * Firestore Trigger: Creates a folder in the globally configured Teams channel
 * when a project's `teams.provisionFolder` flag is set to true.
 */
export const onCreateOrUpdateTeamsFolder = onDocumentWritten("projects/{projectId}", async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) {
        logger.info("No data or document deleted, exiting.");
        return;
    }
    const project = change.after.data();
    const projectBefore = change.before.data();

    // Trigger condition: provisionFolder is true and was not true before.
    if (!project?.teams?.provisionFolder || projectBefore?.teams?.provisionFolder === true) {
        logger.info(`Teams folder provisioning not requested for project ${event.params.projectId}.`);
        return;
    }

    if (project.teamsFolder?.rootItemId) {
        logger.info(`Teams folder already exists for project ${event.params.projectId}. Skipping.`);
        // Reset the flag to prevent re-triggering
        return change.after.ref.update({ 'teams.provisionFolder': false });
    }
    
    const projectName = project.projectCode || project.name; // Use projectCode if available
    if (!projectName) {
        logger.error(`Project ${event.params.projectId} is missing a name/code.`);
        return change.after.ref.update({ 'teamsFolder.error': 'Project name/code is missing.' });
    }
    
    try {
        const client = getGraphClient();
        logger.info(`Provisioning Teams folder for project: "${projectName}"`);
        const rootFolder = await createFolderInTeamsChannel(client, projectName);

        const folderData = {
            driveId: rootFolder.parentReference.driveId,
            rootItemId: rootFolder.id,
            webUrl: rootFolder.webUrl,
            lastSync: new Date().toISOString(),
            error: null, // Clear any previous errors
        };
        
        // Update the project with the new folder data and reset the trigger flag.
        return change.after.ref.update({ 
            'teamsFolder': folderData,
            'teams.provisionFolder': false 
        });
    } catch (error: any) {
        logger.error(`Failed to create Teams folder for project ${event.params.projectId}:`, error);
        return change.after.ref.update({ 'teamsFolder.error': error.message });
    }
});


/**
 * HTTP-callable: Syncs file changes from all configured Teams folders back to Firestore.
 */
export const onSyncTeamsChanges = onRequest(requestOptions, async (req, res) => {
    logger.info("Starting Teams delta sync for all enabled projects.");
    
    try {
        // Query for projects that have a driveId, indicating they've been provisioned.
        const projectsSnapshot = await db.collection('projects').where('teamsFolder.driveId', '!=', null).get();
        
        if (projectsSnapshot.empty) {
            logger.info("No projects with Teams integration provisioned. Sync complete.");
            res.status(200).send("No projects to sync.");
            return;
        }
        
        const client = getGraphClient();
        const syncPromises = projectsSnapshot.docs.map(async (projectDoc) => {
            const projectRef = projectDoc.ref;
            const project = projectDoc.data();

            if (!project.teamsFolder?.driveId) {
                logger.warn(`Project ${projectDoc.id} is missing driveId. Skipping.`);
                return;
            }

            logger.info(`Syncing changes for project ${projectDoc.id}, drive ${project.teamsFolder.driveId}`);
            
            const { changes, deltaToken } = await getDeltaChanges(client, project.teamsFolder.driveId, project.teamsFolder.deltaToken);
            
            if (changes.length === 0) {
                 logger.info(`No changes detected for project ${projectDoc.id}.`);
                 if (deltaToken) {
                    await projectRef.update({ 'teamsFolder.lastSync': new Date().toISOString(), 'teamsFolder.deltaToken': deltaToken });
                 }
                 return;
            }

            const batch = db.batch();
            const filesRef = projectRef.collection('teamsFiles');

            for (const change of changes) {
                const fileDocRef = filesRef.doc(change.id!);

                if (change.deleted) {
                     logger.info(`Marking file ${change.id} as deleted for project ${projectDoc.id}.`);
                    batch.update(fileDocRef, { status: "missing" });
                } else if (change.file) { // Only sync files, not folders
                     logger.info(`Updating file ${change.id} for project ${projectDoc.id}.`);
                     batch.set(fileDocRef, driveItemToFirestore(change), { merge: true });
                }
            }
            
            if (deltaToken) {
                batch.update(projectRef, { 'teamsFolder.lastSync': new Date().toISOString(), 'teamsFolder.deltaToken': deltaToken });
            }

            await batch.commit();
        });

        await Promise.all(syncPromises);
        logger.info("Teams delta sync completed successfully.");
        res.status(200).send("Sync completed successfully.");

    } catch (error: any) {
        logger.error("Error during Teams delta sync:", error);
        res.status(500).send("An error occurred during sync: " + error.message);
    }
});
