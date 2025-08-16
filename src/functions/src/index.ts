// functions/src/index.ts
/**
 * @fileOverview Firebase Cloud Functions for the Equanimity application.
 * This file handles backend logic for user creation, code generation, and MS Teams integration.
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest, HttpsOptions } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { 
    getGraphClient, 
    getDeltaChanges, 
    createFolderInTeamsChannel,
    driveItemToFirestore,
} from './graph-helper';

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const requestOptions: HttpsOptions = { cors: true, enforceAppCheck: false };

/**
 * =================================================================
 * USER & ORGANIZATION MANAGEMENT
 * =================================================================
 */

/**
 * Triggered when a new user signs up via Firebase Auth.
 * This function creates a default organization for the user and adds them to it.
 * In a production scenario, this might instead add them to an invited organization.
 */
export const oncreateuser = onUserCreate(async (event) => {
    const user = event.data;
    const { uid, email } = user;
    logger.info(`New user signed up: ${uid}, Email: ${email}`);

    const batch = db.batch();

    // 1. Create a new organization for the user.
    const orgRef = db.collection('orgs').doc(); // Auto-generate ID
    const orgData = {
        name: `${email?.split('@')[0] || 'New'}'s Organization`,
        ownerId: uid,
        createdAt: FieldValue.serverTimestamp(),
        // Default integration settings can be placed here
        integrations: {
            teams: {
                enabled: false,
                teamId: null,
                channelId: null,
            }
        }
    };
    batch.set(orgRef, orgData);

    // 2. Create the user's profile within the new organization.
    const userRef = orgRef.collection('users').doc(uid);
    const userProfile = {
        email,
        roles: ['owner', 'admin'], // Grant owner and admin roles by default
        createdAt: FieldValue.serverTimestamp(),
    };
    batch.set(userRef, userProfile);
    
    // 3. Create a default tracking category for the new org.
    const trackingRef = orgRef.collection('mappings').doc('tracking').collection('categories').doc();
    batch.set(trackingRef, { name: 'Projects', options: [] });

    try {
        await batch.commit();
        logger.info(`Successfully created organization ${orgRef.id} for user ${uid}.`);
    } catch (error) {
        logger.error(`Error creating organization for user ${uid}:`, error);
    }
});


/**
 * =================================================================
 * TEAMS INTEGRATION FUNCTIONS (APPLICATION)
 * =================================================================
 */

/**
 * Firestore Trigger: Creates a folder in the configured Teams channel
 * when a new job is created within an organization that has Teams integration enabled.
 */
export const onCreateJobCreateTeamsFolder = onDocumentCreated("orgs/{orgId}/jobs/{jobId}", async (event) => {
    const orgId = event.params.orgId;
    const job = event.data?.data();

    if (!job) {
        logger.info("No job data found, exiting.");
        return;
    }

    const orgRef = db.collection('orgs').doc(orgId);
    const orgDoc = await orgRef.get();
    const orgData = orgDoc.data();

    if (!orgData?.integrations?.teams?.enabled || !orgData.integrations.teams.teamId || !orgData.integrations.teams.channelId) {
        logger.info(`Teams integration not enabled or configured for org ${orgId}.`);
        return;
    }
    
    if (job.xero?.trackingOptionKey) {
        logger.info(`Teams folder may already exist for job ${event.params.jobId}. Skipping.`);
        return;
    }
    
    const jobName = job.code || job.name;
    if (!jobName) {
        logger.error(`Job ${event.params.jobId} is missing a name/code.`);
        return;
    }
    
    try {
        const client = getGraphClient({
            tenantId: orgData.integrations.teams.tenantId, // Assuming you store these per-org now
            clientId: orgData.integrations.teams.clientId,
            clientSecret: orgData.integrations.teams.clientSecret, // This should be securely stored/retrieved, e.g., from Secret Manager
        });
        
        logger.info(`Provisioning Teams folder for job: "${jobName}"`);
        const rootFolder = await createFolderInTeamsChannel(client, orgData.integrations.teams.teamId, orgData.integrations.teams.channelId, jobName);

        const folderData = {
            driveId: rootFolder.parentReference.driveId,
            itemId: rootFolder.id,
            webUrl: rootFolder.webUrl,
            lastSync: FieldValue.serverTimestamp(),
        };
        
        // This function would typically live in a dedicated module, e.g., 'xero-helper.ts'
        // await createXeroTrackingOption(orgId, job.name, job.id);
        
        // Update the job with the new folder data
        return event.data?.ref.update({ 
            'teams.folder': folderData,
            'xero.trackingOptionKey': jobName, // Use job name as tracking key
        });

    } catch (error: any) {
        logger.error(`Failed to create Teams folder for job ${event.params.jobId}:`, error);
        return event.data?.ref.update({ 'teams.error': error.message });
    }
});


/**
 * HTTP-callable: Syncs file changes from all configured Teams folders back to Firestore.
 * In a real app, this would be triggered per-organization.
 */
export const onSyncAllTeamsChanges = onRequest(requestOptions, async (req, res) => {
    logger.info("Starting Teams delta sync for all enabled organizations.");
    
    try {
        // Query for orgs that have a teams driveId configured.
        const orgsSnapshot = await db.collection('orgs').where('integrations.teams.driveId', '!=', null).get();
        
        if (orgsSnapshot.empty) {
            logger.info("No orgs with Teams integration configured. Sync complete.");
            res.status(200).send("No orgs to sync.");
            return;
        }
        
        const syncPromises = orgsSnapshot.docs.map(async (orgDoc) => {
            const orgData = orgDoc.data();
            const orgId = orgDoc.id;
            const driveId = orgData.integrations.teams.driveId;
            const deltaToken = orgData.integrations.teams.deltaToken;

            logger.info(`Syncing changes for org ${orgId}, drive ${driveId}`);
            
            const client = getGraphClient({
                tenantId: orgData.integrations.teams.tenantId,
                clientId: orgData.integrations.teams.clientId,
                clientSecret: orgData.integrations.teams.clientSecret,
            });

            const result = await getDeltaChanges(client, driveId, deltaToken);
            
            if (result.changes.length === 0) {
                 logger.info(`No changes detected for org ${orgId}.`);
                 if (result.deltaToken) {
                    await orgDoc.ref.update({ 
                        'integrations.teams.lastSync': FieldValue.serverTimestamp(),
                        'integrations.teams.deltaToken': result.deltaToken,
                    });
                 }
                 return;
            }

            const batch = db.batch();
            const filesRef = orgDoc.ref.collection('documents');

            for (const change of result.changes) {
                // This logic needs to be adapted to map files to jobs/intents
                if (change.file) {
                    logger.info(`Found file change for ${change.name} in org ${orgId}.`);
                    // Example: batch.set(filesRef.doc(change.id!), driveItemToFirestore(change), { merge: true });
                }
            }
            
            if (result.deltaToken) {
                 batch.update(orgDoc.ref, { 
                    'integrations.teams.lastSync': FieldValue.serverTimestamp(),
                    'integrations.teams.deltaToken': result.deltaToken,
                });
            }

            await batch.commit();
        });

        await Promise.all(syncPromises);
        logger.info("Teams delta sync completed successfully for all orgs.");
        res.status(200).send("Sync completed successfully.");

    } catch (error: any) {
        logger.error("Error during Teams delta sync:", error);
        res.status(500).send("An error occurred during sync: " + error.message);
    }
});
