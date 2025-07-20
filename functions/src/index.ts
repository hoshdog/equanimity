/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Creates a user profile document in Firestore whenever a new user signs up.
 */
export const createuserprofile = onUserCreate((event) => {
  const user = event.data; // The user data.
  const { uid, email } = user;

  logger.info(`New user signed up: ${uid}, Email: ${email}`);

  const userProfile = {
    uid,
    email,
    displayName: email?.split('@')[0] || 'New User',
    createdAt: new Date().toISOString(),
    // Add any other default fields you want for a new user
    roles: ['user'], // Default role
  };
  
  // Create a new document in the 'users' collection with the user's UID.
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
