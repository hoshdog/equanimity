# Equanimity Cloud Functions

This directory contains the backend Cloud Functions for the Equanimity application.

## OneDrive Integration Setup

To enable the OneDrive integration, you must configure an Azure App Registration and set the required environment variables for your functions.

### 1. Azure App Registration

1.  Go to the [Azure Portal](https://portal.azure.com/) and navigate to **Microsoft Entra ID > App registrations**.
2.  Click **New registration**.
3.  Give it a name (e.g., "EquanimityAppOneDriveIntegration").
4.  Select **Accounts in this organizational directory only (Single tenant)**.
5.  Click **Register**.

### 2. Configure API Permissions

1.  In your new App registration, go to the **API permissions** tab.
2.  Click **Add a permission**.
3.  Select **Microsoft Graph**.
4.  Select **Application permissions**.
5.  Search for and add the following permission:
    *   `Files.ReadWrite.All`
6.  Click **Grant admin consent for [Your Tenant]**. This is crucial for the client credentials flow to work.

### 3. Create a Client Secret

1.  Go to the **Certificates & secrets** tab.
2.  Click **New client secret**.
3.  Give it a description and an expiry period.
4.  **Important:** Copy the **Value** of the secret immediately. You will not be able to see it again. This is your `AZURE_CLIENT_SECRET`.

### 4. Set Environment Variables

You need to set the following environment variables for your Firebase Functions. You can do this using the Firebase CLI:

```bash
firebase functions:config:set azure.client_id="YOUR_APPLICATION_CLIENT_ID"
firebase functions:config:set azure.tenant_id="YOUR_DIRECTORY_TENANT_ID"
firebase functions:config:set azure.client_secret="YOUR_CLIENT_SECRET_VALUE"
firebase functions:config:set onedrive.user_id="USER_ID_OF_ONEDRIVE_ACCOUNT"
```

*   `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` can be found on the **Overview** page of your App registration.
*   `ONEDRIVE_USER_ID` is the User Principal Name (usually the email address) of the single OneDrive account where all project folders will be created (e.g., `projects@yourcompany.com`).

After setting the config, deploy your functions for the changes to take effect:

```bash
firebase deploy --only functions
```

### 5. Define OneDrive Folder Templates

To use the automated folder creation, you must define templates in your Firestore database.

1.  Go to your Firestore database in the Firebase Console.
2.  Create a top-level collection named `oneDriveTemplates`.
3.  Create a new document in this collection. The **Document ID** of this document is your `templateName`. For example, `standard-project`.
4.  Inside this document, add a single field:
    *   **Field Name:** `folders`
    *   **Field Type:** `array`
    *   **Field Value:** An array of strings, where each string is the name of a subfolder you want to create.

**Example `oneDriveTemplates/standard-project` document:**

```json
{
  "folders": [
    "01 - Contracts & Agreements",
    "02 - Designs & Schematics",
    "03 - Quotes & Variations",
    "04 - Invoices & Payments",
    "05 - Photos & Site Documentation"
  ]
}
```

Now, when you create or update a project in Firestore and set `oneDriveConfig.templateName` to `standard-project`, the function will create a root folder with the project's name and all the subfolders listed above inside it.
