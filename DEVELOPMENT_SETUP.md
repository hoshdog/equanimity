# Equanimity - Local Development Setup Guide

## Quick Start

```bash
# 1. Clone and navigate
cd Equanimity

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

---

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (For server-side operations)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key"

# Google AI (For Genkit functionality)
GOOGLE_GENAI_API_KEY=your_google_ai_key

# Microsoft Graph (For Teams integration)
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
```

### Optional Configuration

```env
# Google Maps (For address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key

# Security (Use strong random values in production)
JWT_SECRET=your_jwt_secret_min_32_chars
ENCRYPTION_KEY=your_encryption_key_32_chars
```

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or use existing
3. Enable Firestore Database
4. Enable Authentication
5. Enable Cloud Functions
6. Enable Storage

### 2. Configure Authentication

1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google (optional)
4. Add authorized domains for production

### 3. Firestore Rules

The project includes secure Firestore rules in `firestore.rules`:
- Role-based access control
- Organization-level data isolation
- Sensitive data protection

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 4. Cloud Functions

Deploy functions:
```bash
cd functions
npm install
firebase deploy --only functions
```

---

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Genkit AI development UI
npm run genkit:dev
npm run genkit:watch    # Auto-reload

# Build and validation
npm run build
npm run typecheck
npm run lint

# Database operations
npm run db:seed
```

---

## Project Structure (After Cleanup)

```
equanimity/
├── 📁 docs/                    # Documentation
├── 📁 logs/                    # Debug logs (gitignored)
├── 📁 scripts/                 # Database seeding, utilities
├── 📁 functions/               # Firebase Cloud Functions
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router pages
│   ├── 📁 components/          # Reusable UI components
│   ├── 📁 lib/                 # Business logic, data access
│   ├── 📁 ai/                  # AI flows and Genkit integration
│   ├── 📁 context/             # React context providers
│   └── 📁 hooks/               # Custom React hooks
├── 📄 .env.local               # Local environment variables
├── 📄 .env.example             # Environment template
├── 📄 CLAUDE.md                # Project documentation
└── 📄 firestore.rules          # Firestore security rules
```

---

## Common Issues & Solutions

### Build Errors

**Issue**: `Cannot find module` errors
```bash
# Solution: Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
```

**Issue**: Firebase Auth errors
```bash
# Solution: Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY
# Ensure all Firebase config is correct
```

### Development Server Issues

**Issue**: Port 3000 already in use
```bash
# Solution: Use different port
PORT=3001 npm run dev
```

**Issue**: SSR/Hydration errors
- Check for browser-only APIs in server components
- Ensure proper `'use client'` directives
- Verify environment variables are available

### Security Issues

**Issue**: Firestore permission denied
- Verify authentication is working
- Check user roles in Firestore
- Review firestore.rules configuration

---

## Testing

### Unit Testing (TODO)
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react

# Run tests
npm test
```

### E2E Testing (TODO)
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
```

### Firebase Emulators

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Run with emulators
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 npm run dev
```

---

## Deployment

### Development Deployment
```bash
# Build project
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

### Production Checklist
- [ ] Update environment variables with production values
- [ ] Review and test Firestore security rules
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry, Analytics)
- [ ] Configure backup strategy
- [ ] Performance testing
- [ ] Security audit

---

## Architecture Decisions

### Frontend
- **Next.js 15.3.3** with App Router for modern React patterns
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components for consistent UI

### Backend
- **Firebase Firestore** for database
- **Firebase Cloud Functions** for server-side logic
- **Firebase Authentication** for user management
- **Firebase Storage** for file uploads

### AI Integration
- **Google Genkit** for AI workflow automation
- **Server-side execution** for security
- **Type-safe flows** with Zod validation

### Business Logic
- **Provider-agnostic architecture** for accounting integrations
- **Multi-tenant design** with organization isolation
- **ISO-9001 compliance** with document versioning
- **Role-based access control** for security

---

## Getting Help

1. **Documentation**: Check `docs/` directory
2. **Issues**: Review `docs/EQUANIMITY_PROJECT_AUDIT.md`
3. **Architecture**: See `CLAUDE.md` for project overview
4. **Firebase**: Check Firebase Console for errors
5. **Logs**: Check `logs/` directory for debug information

---

*Last Updated: December 2024*
*Next Review: After critical fixes implementation*