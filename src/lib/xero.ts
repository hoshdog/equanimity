// src/lib/xero.ts
// This file is now deprecated and its contents should be moved into the new
// provider adapter structure. It is kept temporarily to avoid breaking imports
// but will be removed in a future step.

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define placeholder types to avoid crashing the app
type XeroClient = any;
type TokenSet = any;


// This would typically be a specific user ID, but for this demo, we'll use a singleton
const TOKEN_DOC_ID = 'xero_tokens';

let xero: XeroClient;

function getRedirectUri(): string {
    if (process.env.NODE_ENV === 'production') {
        // This should be your deployed app's URL
        return process.env.XERO_REDIRECT_URI || 'https://your-app-url.com/api/xero/callback';
    }
    // Assumes a local dev server running on port 9002
    return process.env.XERO_REDIRECT_URI || 'http://localhost:9002/api/xero/callback';
}

export function initializeXeroClient(): XeroClient {
    if (!xero) {
        // xero = new XeroClient({
        //     clientId: process.env.XERO_CLIENT_ID || '',
        //     clientSecret: process.env.XERO_CLIENT_SECRET || '',
        //     redirectUris: [getRedirectUri()],
        //     scopes: 'openid profile email accounting.transactions accounting.contacts offline_access'.split(' '),
        // });
        console.warn("Xero client is not initialized because 'xero-node' is not installed.");
        xero = {
            buildConsentUrl: async () => 'about:blank#xero-disabled',
            apiCallback: async () => ({}),
            setTokenSet: async () => {},
            refreshWithRefreshToken: async () => ({}),
            tenants: [],
        }
    }
    return xero;
}

export async function getXeroTokenSet(): Promise<TokenSet | null> {
    const tokenDocRef = doc(db, 'system_tokens', TOKEN_DOC_ID);
    const docSnap = await getDoc(tokenDocRef);

    if (docSnap.exists()) {
        return docSnap.data() as TokenSet;
    }
    return null;
}

export async function setXeroTokenSet(tokenSet: TokenSet): Promise<void> {
    const tokenDocRef = doc(db, 'system_tokens', TOKEN_DOC_ID);
    await setDoc(tokenDocRef, JSON.parse(JSON.stringify(tokenSet)), { merge: true });
}

export async function getConnectedTenants() {
    const xeroClient = initializeXeroClient();
    const tokenSet = await getXeroTokenSet();

    if (!tokenSet) {
        throw new Error('Not connected to Xero');
    }
    
    // await xeroClient.setTokenSet(tokenSet);
    
    // if (tokenSet.expired()) {
    //     const validTokenSet = await xeroClient.refreshWithRefreshToken(
    //         process.env.XERO_CLIENT_ID,
    //         process.env.XERO_CLIENT_SECRET,
    //         tokenSet.refresh_token!
    //     );
    //     await setXeroTokenSet(validTokenSet);
    //     await xeroClient.setTokenSet(validTokenSet);
    // }
    
    return xeroClient.tenants;
}
