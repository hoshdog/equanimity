# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## ISO-9001 Naming & Versioning Conventions

To maintain compliance and ensure traceability, the application adheres to a strict set of naming and versioning conventions for all key entities and documents.

### Entity Code Generation

Upon creation, each key entity is assigned a unique, human-readable code. These codes are generated automatically on the server and are immutable.

-   **Project**: `PRJ-<YYYY>-<seq>` (e.g., `PRJ-2024-001`)
-   **Quote**: `QUO-<YYYY>-<seq>` (e.g., `QUO-2024-001`)
-   **Job**: `<projectCode>-JB-<seq>` (e.g., `PRJ-2024-001-JB-001`)
-   **Task**: `<jobCode>-TS-<seq>` (e.g., `PRJ-2024-001-JB-001-TS-001`)
-   **Invoice**: `INV-<YYYY>-<seq>` (e.g., `INV-2024-001`)
-   **CAPA**: `CAPA-<YYYY>-<seq>` (e.g., `CAPA-2024-001`)

Where `<YYYY>` is the four-digit year and `<seq>` is a sequence number that resets annually.

### Document & Attachment Naming

All file uploads associated with an entity are versioned and named according to the following convention to prevent ambiguity and data loss:

-   **Format**: `{EntityCode}_{DocumentType}_v{Version}.{ext}`
-   **Example**: `PRJ-2024-015_ScopeOfWork_v2.pdf`

The version number (`v{Version}`) is automatically incremented upon each re-upload or revision of the document.

### Application Versioning

The application follows Semantic Versioning (`v<major>.<minor>.<patch>`). To update the app version:

1.  Open the `package.json` file in the root directory.
2.  Locate the `"version"` key.
3.  Increment the version number according to the following rules:
    -   **MAJOR** version for incompatible API changes.
    -   **MINOR** version for adding functionality in a backwards-compatible manner.
    -   **PATCH** version for backwards-compatible bug fixes.
4.  Commit the change to `package.json`. The new version will be reflected in the application's Admin/About page upon the next deployment.
