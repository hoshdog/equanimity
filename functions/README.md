# Equanimity Cloud Functions

This directory contains the backend Cloud Functions for the Equanimity application.

## Integrations Setup (OneDrive & Microsoft Teams)

To enable the OneDrive and/or Microsoft Teams integrations, you must configure an Azure App Registration and set the required environment variables for your functions.

### 1. Azure App Registration

1.  Go to the [Azure Portal](https://portal.azure.com/) and navigate to **Microsoft Entra ID > App registrations**.
2.  Click **New registration**.
3.  Give it a name (e.g., "EquanimityAppIntegration").
4.  Select **Accounts in this organizational directory only (Single tenant)**.
5.  Click **Register**.

### 2. Configure API Permissions

1.  In your new App registration, go to the **API permissions** tab.
2.  Click **Add a permission**.
3.  Select **Microsoft Graph**.
4.  Select **Application permissions**.
5.  Search for and add the following permissions:
    *   `Files.ReadWrite.All` (Required for both OneDrive and Teams file operations)
    *   `Sites.ReadWrite.All` (Required for Teams Channel integration to write files)
6.  **CRUCIAL STEP:** Click **Grant admin consent for [Your Tenant]**. This is required for application permissions (client credentials flow) to work. A global administrator for your Azure tenant must perform this step.

### 3. Create a Client Secret

1.  Go to the **Certificates & secrets** tab.
2.  Click **New client secret**.
3.  Give it a description and an expiry period (e.g., "AppSecret", 12 months).
4.  **Important:** Copy the **Value** of the secret immediately. You will not be able to see it again. This is your `AZURE_CLIENT_SECRET`.

### 4. Set Environment Variables

You need to set the following environment variables for your Firebase Functions. You can do this using the Firebase CLI:

```bash
# Core Azure App Credentials
firebase functions:config:set azure.client_id="YOUR_APPLICATION_CLIENT_ID"
firebase functions:config:set azure.tenant_id="YOUR_DIRECTORY_TENANT_ID"
firebase functions:config:set azure.client_secret="YOUR_CLIENT_SECRET_VALUE"

# For Global Teams Integration
firebase functions:config:set teams.team_id="YOUR_TARGET_TEAM_ID"
firebase functions:config:g:set teams.channel_id="YOUR_TARGET_CHANNEL_ID"

# Optional: For user-delegated OneDrive Integration
firebase functions:config:set onedrive.user_id="USER_ID_OF_ONEDRIVE_ACCOUNT"
```

*   `AZURE_CLIENT_ID` (Application (client) ID) and `AZURE_TENANT_ID` (Directory (tenant) ID) can be found on the **Overview** page of your App registration.
*   To find the `TEAMS_TEAM_ID` and `TEAMS_CHANNEL_ID`:
    1.  Open Microsoft Teams.
    2.  Navigate to the desired channel.
    3.  Click the three dots (...) next to the channel name and select "Get link to channel".
    4.  The link will look like: `https://teams.microsoft.com/l/channel/19%3a...%40thread.tacv2/General?groupId=TEAM_ID&tenantId=...`
    5.  The `groupId` is your `TEAMS_TEAM_ID`.
    6.  The URL-decoded string after `19%3a` and before the next `/` is your `TEAMS_CHANNEL_ID`.

After setting the config, deploy your functions for the changes to take effect:

```bash
firebase deploy --only functions
```

### 5. Define OneDrive Folder Templates (Optional)

If using the user-delegated OneDrive integration, you must define templates in your Firestore database.

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
