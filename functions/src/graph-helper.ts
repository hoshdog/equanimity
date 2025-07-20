// functions/src/graph-helper.ts
/**
 * @fileOverview A helper module for interacting with the Microsoft Graph API.
 * 
 * This module encapsulates the logic for authenticating with Azure AD,
 * creating folders and permissions in OneDrive, and performing delta syncs.
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import "isomorphic-fetch";
import * as logger from "firebase-functions/logger";

const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, ONEDRIVE_USER_ID } = process.env;

if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !ONEDRIVE_USER_ID) {
    throw new Error("Missing required Azure environment variables for Graph API authentication.");
}

/**
 * Creates and returns an authenticated Microsoft Graph client instance.
 * @returns {Client} An initialized Graph client.
 */
export function getGraphClient(): Client {
    const credential = new ClientSecretCredential(
        AZURE_TENANT_ID!,
        AZURE_CLIENT_ID!,
        AZURE_CLIENT_SECRET!
    );
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
    });

    return Client.initWithMiddleware({ authProvider });
}

/**
 * Creates a folder in a specified parent folder or the root of a drive.
 * @param {Client} client - The authenticated Graph client.
 * @param {string} folderName - The name of the folder to create.
 * @param {string} [parentId] - The ID of the parent folder. If not provided, creates in the root.
 * @returns {Promise<any>} The driveItem object of the created folder.
 */
export async function createFolder(client: Client, folderName: string, parentId?: string): Promise<any> {
    const folder = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
    };

    const url = parentId
        ? `/users/${ONEDRIVE_USER_ID}/drive/items/${parentId}/children`
        : `/users/${ONEDRIVE_USER_ID}/drive/root/children`;

    return client.api(url).post(folder);
}

/**
 * Grants write permissions to a user on a specific drive item.
 * @param {Client} client - The authenticated Graph client.
 * @param {string} itemId - The ID of the drive item (folder).
 * @param {string} userEmail - The email address of the user to grant permission to.
 * @returns {Promise<any>} The permission object.
 */
export async function grantPermission(client: Client, itemId: string, userEmail: string): Promise<any> {
    const permission = {
        recipients: [{ email: userEmail }],
        message: "You have been granted access to this project folder.",
        requireSignIn: true,
        sendInvitation: true,
        roles: ['write']
    };

    const url = `/users/${ONEDRIVE_USER_ID}/drive/items/${itemId}/invite`;
    return client.api(url).post(permission);
}


/**
 * Fetches delta changes for a given folder in OneDrive.
 * @param {string} folderId The ID of the root folder to sync.
 * @param {string} [deltaToken] The delta token from the previous sync.
 * @returns {Promise<{changes: any[], deltaToken: string}>} A list of changes and the new delta token.
 */
export async function getDeltaChanges(folderId: string, deltaToken?: string): Promise<{ changes: any[], deltaToken: string }> {
  const client = getGraphClient();
  let allChanges: any[] = [];
  let nextLink: string | undefined;

  let url = `/users/${ONEDRIVE_USER_ID}/drive/items/${folderId}/delta`;
  if (deltaToken) {
    url += `?token=${deltaToken}`;
  }

  try {
    let response = await client.api(url).get();
    
    while (response) {
      allChanges = allChanges.concat(response.value);
      
      nextLink = response['@odata.nextLink'];
      const newDeltaToken = response['@odata.deltaLink']?.split('token=')[1];

      if (newDeltaToken) {
        logger.info(`Delta sync successful. Got new delta token for folder ${folderId}.`);
        return { changes: allChanges, deltaToken: newDeltaToken };
      }
      
      if (nextLink) {
        // The API returns a full URL, but we need to call it via the SDK client.
        // We'll extract the relative path and query string.
        const relativeUrl = nextLink.substring(nextLink.indexOf('/v1.0') + 5);
        response = await client.api(relativeUrl).get();
      } else {
        break;
      }
    }
    
    // This case should ideally not be hit if the deltaLink is always present on the last page.
    logger.warn(`No delta token found in the final response for folder ${folderId}.`);
    // Depending on requirements, might need to re-run a full sync.
    // For now, we'll return an empty token to avoid breaking.
    return { changes: allChanges, deltaToken: '' };

  } catch (error) {
    logger.error(`Error fetching delta changes for folder ${folderId}:`, error);
    throw error;
  }
}
