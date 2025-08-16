// functions/src/graph-helper.ts
/**
 * @fileOverview A helper module for interacting with the Microsoft Graph API.
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import "isomorphic-fetch";
import * as logger from "firebase-functions/logger";


const GRAPH_API_SCOPE = process.env.GRAPH_API_SCOPE || 'https://graph.microsoft.com/.default';

interface AzureAppCredentials {
    tenantId: string;
    clientId: string;
    clientSecret: string;
}

/**
 * Creates and returns an authenticated Microsoft Graph client instance using provided credentials.
 * @param {AzureAppCredentials} creds - The Azure App credentials.
 * @returns {Client} An initialized Graph client.
 */
export function getGraphClient(creds: AzureAppCredentials): Client {
    const credential = new ClientSecretCredential(
        creds.tenantId,
        creds.clientId,
        creds.clientSecret
    );
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: [GRAPH_API_SCOPE],
    });

    return Client.initWithMiddleware({ authProvider });
}


/**
 * Creates a folder within a specific Microsoft Teams channel's file library.
 * Requires Sites.ReadWrite.All permission.
 * @param {Client} client - The authenticated Graph client.
 * @param {string} teamId - The ID of the target Team.
 * @param {string} channelId - The ID of the target Channel within the Team.
 * @param {string} folderName - The name of the folder to create.
 * @returns {Promise<any>} The created folder object from Graph API.
 */
export async function createFolderInTeamsChannel(client: Client, teamId: string, channelId: string, folderName: string): Promise<any> {
    const url = `/teams/${teamId}/channels/${channelId}/filesFolder/children`;
    logger.info(`Attempting to create folder "${folderName}" in Teams channel ${channelId}.`);
    const createdFolder = await client.api(url).post({ name: folderName, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' });
    logger.info(`Successfully created folder "${folderName}" with ID ${createdFolder.id}.`);
    return createdFolder;
}

/**
 * Fetches delta changes for a given drive.
 * Requires Sites.Read.All permission.
 */
export async function getDeltaChanges(client: Client, driveId: string, deltaToken?: string): Promise<{ changes: any[], deltaToken: string }> {
  let allChanges: any[] = [];
  let nextLink: string | undefined;

  let url = `/drives/${driveId}/root/delta`;
  if (deltaToken) {
    url += `?token=${deltaToken}`;
  } else {
    // For the initial sync, we might want to select specific fields
    url += '?$select=id,name,webUrl,file,parentReference,deleted,lastModifiedDateTime,lastModifiedBy';
  }

  try {
    let response = await client.api(url).get();
    
    while (response) {
      allChanges = allChanges.concat(response.value);
      
      nextLink = response['@odata.nextLink'];
      const newDeltaToken = response['@odata.deltaLink']?.split('token=')[1];

      if (newDeltaToken) {
        logger.info(`Delta sync successful. Got new delta token for drive ${driveId}.`);
        return { changes: allChanges, deltaToken: newDeltaToken };
      }
      
      if (nextLink) {
        const relativeUrl = nextLink.substring(nextLink.indexOf('/v1.0') + 5);
        response = await client.api(relativeUrl).get();
      } else {
        break;
      }
    }
    
    logger.warn(`No delta token found in the final response for drive ${driveId}.`);
    return { changes: allChanges, deltaToken: '' };

  } catch (error) {
    logger.error(`Error fetching delta changes for drive ${driveId}:`, error);
    throw error;
  }
}

/**
 * Converts a Microsoft Graph driveItem object to a simplified Firestore document.
 * @param {any} item - The driveItem object from Graph API.
 * @returns {object} A simplified object for Firestore.
 */
export function driveItemToFirestore(item: any) {
    return {
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
        size: item.size,
        mimeType: item.file?.mimeType,
        lastModifiedBy: item.lastModifiedBy?.user?.displayName || 'Unknown',
        lastModifiedDateTime: item.lastModifiedDateTime,
        status: 'active',
    };
}
