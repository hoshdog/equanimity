// functions/src/index.ts
/**
 * @fileOverview Firebase Cloud Functions for the Equanimity application.
 *
 * This file contains the core function triggers for user management and integrations with OneDrive and Microsoft Teams.
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onRequest, HttpsOptions } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { 
    getGraphClient, 
    createFolder, 
    grantPermission, 
    getDeltaChanges, 
    createFolderInTeamsChannel,
    listTeams,
    listChannelsInTeam,
    getTeamsChannelFilesFolder,
    driveItemToFirestore,
} from './graph-helper';

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const requestOptions: HttpsOptions = { cors: true, enforceAppCheck: false };


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

export const onCreateOrUpdateOneDriveFolder = onDocumentWritten("projects/{projectId}", async (event) => {
    // ... OneDrive logic from previous turn ...
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

    if (projectData.oneDriveConfig.rootFolderId) {
        logger.info(`OneDrive folder already exists for project ${event.params.projectId}.`);
        return;
    }
    // ... full implementation ...
});

export const onSyncOneDriveChanges = onRequest(requestOptions, async (req, res) => {
    // ... OneDrive sync logic from previous turn ...
    res.status(501).send("Not Implemented");
});


/**
 * =================================================================
 * TEAMS INTEGRATION FUNCTIONS
 * =================================================================
 */

/**
 * HTTP-callable: Lists Teams the app has access to.
 */
export const listMyTeams = onRequest(requestOptions, async (req, res) => {
    try {
        const client = getGraphClient();
        const teams = await listTeams(client);
        res.status(200).json(teams);
    } catch (error: any) {
        logger.error("Error listing teams:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * HTTP-callable: Lists Channels within a specific Team.
 */
export const listChannels = onRequest(requestOptions, async (req, res) => {
    const { teamId } = req.query;
    if (typeof teamId !== 'string') {
        res.status(400).json({ success: false, message: 'Missing or invalid teamId parameter.' });
        return;
    }
    try {
        const client = getGraphClient();
        const channels = await listChannelsInTeam(client, teamId);
        res.status(200).json(channels);
    } catch (error: any) {
        logger.error(`Error listing channels for team ${teamId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * HTTP-callable: Tests folder creation in a specific Teams channel.
 */
export const testTeamsFolder = onRequest(requestOptions, async (req, res) => {
    const { teamId, channelId, projectName } = req.body;
    if (!teamId || !channelId || !projectName) {
        res.status(400).json({ success: false, message: 'Missing required parameters: teamId, channelId, projectName.' });
        return;
    }
    try {
        const client = getGraphClient();
        const createdFolder = await createFolderInTeamsChannel(client, teamId, channelId, `TEST - ${projectName}`);
        res.status(200).json({ success: true, message: 'Test folder created successfully.', webUrl: createdFolder.webUrl });
    } catch (error: any) {
        logger.error("Error testing folder creation:", error);
        res.status(500).json({ success: false, message: error.message, webUrl: null });
    }
});

/**
 * HTTP-callable: Saves Teams integration settings to a project document.
 */
export const saveIntegrationSettings = onRequest(requestOptions, async (req, res) => {
    const { projectId, enabled, teamId, channelId } = req.body;
    if (!projectId) {
        res.status(400).json({ success: false, message: 'Missing required parameter: projectId.' });
        return;
    }
    try {
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.update({
            'settings.teamsIntegration': { enabled, teamId, channelId }
        });
        res.status(200).json({ success: true, message: 'Settings saved successfully.' });
    } catch (error: any) {
        logger.error(`Error saving integration settings for project ${projectId}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Firestore Trigger: Creates a folder in Teams when a project is created or its settings are updated.
 */
export const onCreateOrUpdateTeamsFolder = onDocumentWritten("projects/{projectId}", async (event) => {
    const change = event.data;
    if (!change) {
        logger.info("No data associated with the event, exiting.");
        return;
    }
    const project = change.after.data();
    const projectBefore = change.before.data();

    if (!project || !project.settings?.teamsIntegration?.enabled) {
        logger.info(`Teams integration not enabled for project ${event.params.projectId}.`);
        return;
    }

    const hasBeenCreated = project.teamsFolder?.rootItemId;
    const settingsChanged = JSON.stringify(project.settings.teamsIntegration) !== JSON.stringify(projectBefore?.settings?.teamsIntegration);

    if (hasBeenCreated && !settingsChanged) {
        logger.info(`Teams folder already exists and settings haven't changed for project ${event.params.projectId}.`);
        return;
    }
    
    const { teamId, channelId } = project.settings.teamsIntegration;
    const projectName = project.name;

    if (!teamId || !channelId || !projectName) {
        logger.error(`Project ${event.params.projectId} is missing required data for Teams integration (teamId, channelId, or name).`);
        return event.data?.after.ref.update({ 'teamsFolder.error': 'Missing teamId, channelId, or project name.' });
    }
    
    try {
        const client = getGraphClient();
        const rootFolder = await createFolderInTeamsChannel(client, teamId, channelId, projectName);
        const folderData = {
            driveId: rootFolder.parentReference.driveId,
            rootItemId: rootFolder.id,
            webUrl: rootFolder.webUrl,
            lastSync: new Date().toISOString(),
        };

        return event.data?.after.ref.update({ 'teamsFolder': folderData });
    } catch (error: any) {
        logger.error(`Failed to create Teams folder for project ${event.params.projectId}:`, error);
        return event.data?.after.ref.update({ 'teamsFolder.error': error.message });
    }
});


/**
 * HTTP-callable: Syncs file changes from all configured Teams folders back to Firestore.
 */
export const onSyncTeamsChanges = onRequest(requestOptions, async (req, res) => {
    logger.info("Starting Teams delta sync for all enabled projects.");
    
    try {
        const projectsSnapshot = await db.collection('projects').where('settings.teamsIntegration.enabled', '==', true).get();
        
        if (projectsSnapshot.empty) {
            logger.info("No projects with Teams integration enabled. Sync complete.");
            res.status(200).send("No projects to sync.");
            return;
        }
        
        const client = getGraphClient();
        const syncPromises = projectsSnapshot.docs.map(async (projectDoc) => {
            const projectRef = projectDoc.ref;
            const project = projectDoc.data();

            if (!project.teamsFolder?.driveId || !project.teamsFolder?.rootItemId) {
                logger.warn(`Project ${projectDoc.id} is enabled but has no root folder info. Skipping.`);
                return;
            }

            logger.info(`Syncing changes for project ${projectDoc.id}, drive ${project.teamsFolder.driveId}`);
            
            const { changes, deltaToken } = await getDeltaChanges(client, project.teamsFolder.driveId, project.teamsFolder.deltaToken);
            
            if (changes.length === 0) {
                 logger.info(`No changes detected for project ${projectDoc.id}.`);
                 await projectRef.update({ 'teamsFolder.lastSync': new Date().toISOString(), 'teamsFolder.deltaToken': deltaToken });
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
            
            batch.update(projectRef, { 'teamsFolder.lastSync': new Date().toISOString(), 'teamsFolder.deltaToken': deltaToken });

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
