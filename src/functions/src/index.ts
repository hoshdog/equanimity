// functions/src/index.ts
/**
 * @fileOverview Firebase Cloud Functions for the Equanimity application.
 * This file defines the backend logic for data processing, integrations, and scheduled tasks.
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, onRequest, HttpsOptions } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getGraphClient, createFolderInTeamsChannel } from './graph-helper';

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const httpsOptions: HttpsOptions = { cors: true, enforceAppCheck: false }; // Configure as needed

/**
 * =================================================================
 * USER & ORGANIZATION MANAGEMENT
 * =================================================================
 */

/**
 * Triggered when a new user signs up via Firebase Auth.
 * Creates a default organization for the user.
 */
export const oncreateuser = onUserCreate(async (event) => {
    const user = event.data;
    const { uid, email } = user;
    logger.info(`New user signed up: ${uid}, Email: ${email}`);

    const batch = db.batch();
    const orgRef = db.collection('orgs').doc();

    const orgData = {
        name: `${email?.split('@')[0] || 'New'}'s Organization`,
        ownerId: uid,
        country: 'AU',
        accounting: {
            provider: null,
            status: 'disconnected',
            tenantOrFileId: null,
            lastSyncAt: null,
            scopes: [],
        },
        createdAt: FieldValue.serverTimestamp(),
    };
    batch.set(orgRef, orgData);

    const userRef = orgRef.collection('users').doc(uid);
    const userProfile = {
        email,
        roles: ['owner', 'admin'],
        createdAt: FieldValue.serverTimestamp(),
    };
    batch.set(userRef, userProfile);

    try {
        await batch.commit();
        logger.info(`Successfully created organization ${orgRef.id} for user ${uid}.`);
    } catch (error) {
        logger.error(`Error creating organization for user ${uid}:`, error);
    }
});


/**
 * =================================================================
 * ACCOUNTING PROVIDER FUNCTIONS (HTTPS Callbacks & Triggers)
 * =================================================================
 */

// NOTE: These are stubs. The 'accounting-provider.ts' interface would be implemented
// by concrete 'xero-adapter.ts' and 'myob-adapter.ts' files, which these functions would call.

export const connect_startAuth = onCall(httpsOptions, async (request) => {
    // 1. Get orgId from request context.
    // 2. Load org's config.
    // 3. Instantiate the correct provider adapter (Xero or MYOB).
    // 4. Call adapter.auth.startAuth(orgId) to get the consent URL.
    // 5. Return the URL to the client.
    logger.info("connect.startAuth called", { data: request.data });
    return { redirectUrl: `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=openid%20profile%20email%20accounting.transactions&state=${request.data.orgId}` };
});

export const connect_handleCallback = onRequest(httpsOptions, async (req, res) => {
    // 1. Get 'code' and 'state' (orgId) from query params.
    // 2. Instantiate provider adapter.
    // 3. Call adapter.auth.handleRedirect(code, state) to get tokens.
    // 4. Encrypt and store tokens in `orgs/{orgId}/tokens/{provider}`.
    // 5. Update `orgs/{orgId}.accounting` status.
    // 6. Redirect user back to the settings page.
    logger.info("connect.handleCallback called", { query: req.query });
    const settingsUrl = new URL('/settings/integrations', process.env.FUNCTION_ORIGIN);
    settingsUrl.searchParams.set('status', 'success');
    res.redirect(settingsUrl.toString());
});

export const sync_pullReferenceData = onCall(httpsOptions, async (request) => {
    // 1. Get orgId from request context.
    // 2. Load org config & tokens.
    // 3. Instantiate provider adapter.
    // 4. Call adapter.pullReferenceData().
    // 5. Write results to `orgs/{orgId}/mappings/*`.
    logger.info("sync.pullReferenceData called for org:", request.data.orgId);
    return { success: true, message: "Reference data sync complete." };
});

export const sync_pushFinancialIntent = onCall(httpsOptions, async (request) => {
    // 1. Get orgId, intentId, idempotencyKey from request.
    // 2. Load org config, tokens, and the FinancialIntent document.
    // 3. Instantiate provider adapter.
    // 4. Call adapter.pushInvoice() or pushBill().
    // 5. Update `financialIntents/{finId}.ledgerRef` with the result.
    logger.info("sync.pushFinancialIntent called", { data: request.data });
    return { success: true, ledgerRef: { id: 'INV-12345', url: 'https://go.xero.com/...' } };
});

export const sync_attachEvidence = onCall(httpsOptions, async (request) => {
    // 1. Get orgId, documentId, ledgerRef from request.
    // 2. Download file from Storage.
    // 3. Instantiate provider adapter.
    // 4. Call adapter.attach().
    // 5. Update `documents/{docId}.providerFileRef`.
    logger.info("sync.attachEvidence called", { data: request.data });
    return { success: true, attachmentId: 'ATTACH-54321' };
});

export const webhooks_handleXero = onRequest(httpsOptions, async (req, res) => {
    // 1. Verify Xero webhook signature.
    // 2. For each event in payload, create a message in the `outbox` collection.
    //    The message's `kind` could be `xero.syncPayment` etc.
    // 3. Acknowledge the webhook with a 200 OK.
    logger.info("webhooks.handleXero called");
    res.status(200).send('OK');
});


/**
 * =================================================================
 * SCHEDULED FUNCTIONS (Internal Processing & Maintenance)
 * =================================================================
 */

export const scheduler_pollMyobDeltas = onRequest(httpsOptions, async (req, res) => {
    // 1. Query all orgs where `accounting.provider == 'myob'`.
    // 2. For each org, instantiate MYOB adapter.
    // 3. Call adapter.listChanges(org.accounting.lastSyncAt).
    // 4. Process changes (e.g., update FinancialIntent status).
    // 5. Update `org.accounting.lastSyncAt`.
    logger.info("scheduler.pollMyobDeltas executed.");
    res.status(200).send('MYOB Polling Complete.');
});

export const scheduler_repairOutbox = onRequest(httpsOptions, async (req, res) => {
    // 1. Query `outbox` for messages with `status == 'PENDING'` or 'FAILED' and `nextRunAt <= now`.
    // 2. For each message, increment `attempts` and process its `kind`.
    // 3. If successful, set status to 'COMPLETED'.
    // 4. If failed, calculate next retry time with backoff and update `nextRunAt`.
    // 5. If attempts > max, set status to 'PARKED'.
    logger.info("scheduler.repairOutbox executed.");
    res.status(200).send('Outbox Repair Complete.');
});


/**
 * =================================================================
 * MS TEAMS INTEGRATION (Per-Org Configuration)
 * =================================================================
 */

export const onProjectCreateCreateTeamsFolder = onDocumentWritten("orgs/{orgId}/projects/{projectId}", async (event) => {
    if (!event.data?.after.exists) {
        logger.info("Project document deleted, no action needed.");
        return;
    }
    
    const orgId = event.params.orgId;
    const project = event.data.after.data();

    if (!project) {
        logger.info("No project data found, exiting.");
        return;
    }
    
    const orgRef = db.collection('orgs').doc(orgId);
    const orgDoc = await orgRef.get();
    const orgData = orgDoc.data();

    if (!orgData?.integrations?.teams?.enabled || !orgData.integrations.teams.teamId || !orgData.integrations.teams.channelId) {
        logger.info(`Teams integration not enabled or configured for org ${orgId}.`);
        return;
    }
    
    // Check if the folder has already been created to prevent re-runs on update
    if (project.teams?.folderId) {
        logger.info(`Teams folder already exists for project ${event.params.projectId}.`);
        return;
    }
    
    const projectName = project.code ? `${project.code} - ${project.name}` : project.name;
    if (!projectName) {
        logger.error(`Project ${event.params.projectId} is missing a name/code.`);
        return;
    }
    
    try {
        // IMPORTANT: In a real app, Azure creds should be stored securely per-org,
        // likely encrypted in the org doc or retrieved from a service like Google Secret Manager.
        const azureCreds = {
            tenantId: orgData.integrations.teams.tenantId,
            clientId: orgData.integrations.teams.clientId,
            clientSecret: orgData.integrations.teams.clientSecret, // This should be retrieved securely
        };
        
        const client = getGraphClient(azureCreds);
        logger.info(`Provisioning Teams folder for project: "${projectName}"`);
        const folder = await createFolderInTeamsChannel(client, orgData.integrations.teams.teamId, orgData.integrations.teams.channelId, projectName);

        const folderData = {
            folderId: folder.id,
            webUrl: folder.webUrl,
            driveId: folder.parentReference.driveId,
            lastSyncAt: FieldValue.serverTimestamp(),
        };
        
        // Update the project with the new folder data
        return event.data.after.ref.update({ 'teams': folderData });

    } catch (error: any) {
        logger.error(`Failed to create Teams folder for project ${event.params.projectId}:`, error);
        return event.data.after.ref.update({ 'teams.error': error.message });
    }
});
