// functions/src/index.ts
/**
 * @fileOverview Firebase Cloud Functions for the Equanimity application.
 *
 * This file contains the core function triggers for user management and integrations.
 * - createuserprofile: Triggered on new user creation to set up their Firestore profile.
 * - onCreateOrUpdateOneDriveFolder: Triggered on project creation/update to provision a OneDrive folder structure.
 * - onCreateTeamsFolderForProject: Triggered on project creation to provision a folder in a Teams channel.
 * - onSyncOneDriveChanges: HTTP-callable function to sync changes from OneDrive back to Firestore.
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getGraphClient, createFolder, grantPermission, getDeltaChanges, createFolderInTeamsChannel } from './graph-helper';

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

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
    createdAt: new Date().toISOString(),
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
 * ONEDRIVE INTEGRATION FUNCTIONS
 * =================================================================
 */

// Environment variables required for this function:
// AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, ONEDRIVE_USER_ID

/**
 * Triggered on project creation or update to provision a folder structure in OneDrive.
 */
export const onCreateOrUpdateOneDriveFolder = onDocumentWritten("projects/{projectId}", async (event) => {
    const change = event.data;
    if (!change) {
        logger.info("No data associated with the event, exiting.");
        return;
    }

    const projectData = change.after.exists ? change.after.data() : null;
    if (!projectData || !projectData.oneDriveConfig?.enabled) {
        logger.info(`OneDrive integration not enabled for project ${event.params.projectId}.`);
        return;
    }

    // Prevent re-running if the folder has already been created
    if (projectData.oneDriveConfig.rootFolderId) {
        logger.info(`OneDrive folder already exists for project ${event.params.projectId}.`);
        return;
    }

    const { templateName, ownerEmail } = projectData.oneDriveConfig;
    const projectName = projectData.name;
    const { projectId } = event.params;

    if (!templateName || !projectName || !ownerEmail) {
        logger.error(`Missing required data for project ${projectId}: templateName, projectName, or ownerEmail.`);
        return;
    }

    try {
        const graphClient = getGraphClient();
        
        // 1. Fetch the folder template from Firestore
        const templateDoc = await db.collection('oneDriveTemplates').doc(templateName).get();
        if (!templateDoc.exists) {
            logger.error(`Template "${templateName}" not found in Firestore for project ${projectId}.`);
            return;
        }
        const templateFolders = templateDoc.data()?.folders as string[] || [];
        
        // 2. Create the root project folder
        logger.info(`Creating root folder for project: ${projectName}`);
        const rootFolder = await createFolder(graphClient, projectName);
        await grantPermission(graphClient, rootFolder.id!, ownerEmail);
        
        const batch = db.batch();
        const projectRef = db.collection('projects').doc(projectId);
        const rootFolderRef = projectRef.collection('oneDriveFolders').doc(rootFolder.id!);
        
        // Update the main project doc with the root folder ID
        batch.update(projectRef, { 'oneDriveConfig.rootFolderId': rootFolder.id });

        batch.set(rootFolderRef, {
            name: rootFolder.name,
            webUrl: rootFolder.webUrl,
            driveItemId: rootFolder.id,
            isRoot: true,
            status: "active",
        });

        // 3. Create subfolders
        for (const folderName of templateFolders) {
            logger.info(`Creating subfolder: ${folderName} in ${projectName}`);
            const subFolder = await createFolder(graphClient, folderName, rootFolder.id);
            const subFolderRef = projectRef.collection('oneDriveFolders').doc(subFolder.id!);
             batch.set(subFolderRef, {
                name: subFolder.name,
                webUrl: subFolder.webUrl,
                driveItemId: subFolder.id,
                isRoot: false,
                status: "active",
            });
        }
        
        await batch.commit();
        logger.info(`Successfully created OneDrive folder structure for project ${projectId}.`);

    } catch (error) {
        logger.error(`Failed to create OneDrive folders for project ${projectId}:`, error);
        // Add more robust error handling/retry logic here if needed
    }
});

/**
 * HTTP-callable function to sync changes from OneDrive for all enabled projects.
 * Can be triggered by a Pub/Sub scheduler or a manual admin action.
 */
export const onSyncOneDriveChanges = onRequest({ cors: true }, async (req, res) => {
    logger.info("Starting OneDrive delta sync for all enabled projects.");
    
    try {
        const projectsSnapshot = await db.collection('projects').where('oneDriveConfig.enabled', '==', true).get();
        
        if (projectsSnapshot.empty) {
            logger.info("No projects with OneDrive enabled. Sync complete.");
            res.status(200).send("No projects to sync.");
            return;
        }

        const syncPromises = projectsSnapshot.docs.map(async (projectDoc) => {
            const projectId = projectDoc.id;
            const oneDriveFoldersRef = projectDoc.ref.collection('oneDriveFolders');
            const rootFolderSnapshot = await oneDriveFoldersRef.where('isRoot', '==', true).limit(1).get();

            if (rootFolderSnapshot.empty) {
                logger.warn(`Project ${projectId} is enabled but has no root folder record. Skipping.`);
                return;
            }

            const rootFolder = rootFolderSnapshot.docs[0];
            const rootFolderId = rootFolder.id;
            
            logger.info(`Syncing changes for project ${projectId}, root folder ${rootFolderId}`);
            
            // Get delta changes from Graph API
            const { changes, deltaToken } = await getDeltaChanges(rootFolderId);
            
            const batch = db.batch();

            for (const change of changes) {
                const folderRef = oneDriveFoldersRef.doc(change.id!);

                if (change.deleted) {
                     logger.info(`Marking folder ${change.id} as deleted for project ${projectId}.`);
                    batch.update(folderRef, { status: "missing" });
                } else if (change.parentReference?.id === rootFolderId) {
                     logger.info(`Updating folder ${change.id} for project ${projectId}.`);
                    batch.set(folderRef, {
                        name: change.name,
                        webUrl: change.webUrl,
                        driveItemId: change.id,
                        status: "active",
                    }, { merge: true });
                }
            }
            
            // Store the new delta token for the next sync
            batch.update(rootFolder.ref, { deltaToken });

            await batch.commit();
        });

        await Promise.all(syncPromises);
        logger.info("OneDrive delta sync completed successfully.");
        res.status(200).send("Sync completed successfully.");

    } catch (error) {
        logger.error("Error during OneDrive delta sync:", error);
        res.status(500).send("An error occurred during sync.");
    }
});


/**
 * =================================================================
 * TEAMS INTEGRATION FUNCTIONS
 * =================================================================
 */

/**
 * Triggered on new project creation to provision a folder in a specific Teams channel.
 */
export const onCreateTeamsFolderForProject = onDocumentCreated("projects/{projectId}", async (event) => {
    const project = event.data?.data();
    if (!project) {
        logger.info("No data associated with the event, exiting.");
        return;
    }

    if (!project.teamsConfig?.enabled) {
        logger.info(`Teams integration not enabled for project ${event.params.projectId}.`);
        return;
    }
    
    const projectName = project.name;
    if (!projectName) {
        logger.error(`Project ${event.params.projectId} is missing a name.`);
        return;
    }

    try {
        const graphClient = getGraphClient();
        const teamsFolder = await createFolderInTeamsChannel(graphClient, projectName);

        const folderData = {
            driveId: teamsFolder.parentReference.driveId,
            itemId: teamsFolder.id,
            webUrl: teamsFolder.webUrl,
        };

        // Write the folder details back to the project document
        return event.data?.ref.update({ 'teamsFolder': folderData });

    } catch (error) {
        logger.error(`Failed to create Teams folder for project ${event.params.projectId}:`, error);
        // Optional: Update the project to indicate failure
        return event.data?.ref.update({ 'teamsFolder.error': (error as Error).message });
    }
});
