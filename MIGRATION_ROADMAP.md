# Equanimity: Supabase Migration Roadmap

## Executive Summary

After comprehensive architectural analysis, we've made the strategic decision to migrate from Firebase to Supabase. This document outlines the complete migration path.

## Current State (December 2024)

### ✅ Resolved Issues
1. **Authentication**: Fixed setState rendering error, implemented mock auth
2. **Firebase API**: Disabled invalid API keys, using mock authentication
3. **Memory Leaks**: Fixed TimeTrackerProvider cleanup issues
4. **TypeScript**: Resolved configuration errors
5. **Error Handling**: Implemented application-wide error boundaries

### 🚀 Development Ready
- **Mock Authentication**: Working for local development
- **Quick Login**: admin@equanimity.local / admin123
- **Local Server**: Running on port 3000
- **Feature Flags**: Migration mode enabled

## Migration Timeline: 13 Weeks

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Establish Supabase infrastructure

#### Week 1: Project Setup
- [ ] Create Supabase project in Sydney region
- [ ] Set up development/staging/production environments
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline

#### Week 2: Database Schema
```sql
-- Core tables migration
CREATE SCHEMA IF NOT EXISTS public;

-- Organizations (multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abn TEXT,
  country TEXT DEFAULT 'AU',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users with organization association
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  org_id UUID REFERENCES organizations(id),
  role TEXT CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial intents (provider-agnostic)
CREATE TABLE financial_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  source TEXT CHECK (source IN ('JOB', 'PURCHASE_ORDER', 'TIMESHEET')),
  direction TEXT CHECK (direction IN ('INCOME', 'EXPENSE')),
  job_id UUID,
  contact_id UUID,
  totals_net DECIMAL(10,2),
  totals_tax DECIMAL(10,2),
  totals_grand DECIMAL(10,2),
  ledger_ref JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_financial_intents_org ON financial_intents(org_id);
CREATE INDEX idx_financial_intents_job ON financial_intents(job_id);
CREATE INDEX idx_financial_intents_date ON financial_intents(created_at);
```

#### Week 3: Row-Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_intents ENABLE ROW LEVEL SECURITY;

-- Organization isolation policy
CREATE POLICY "org_isolation" ON financial_intents
  FOR ALL USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Role-based access
CREATE POLICY "admin_full_access" ON financial_intents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND org_id = financial_intents.org_id
    )
  );
```

#### Week 4: Authentication Migration
- [ ] Set up Supabase Auth with email/password
- [ ] Configure OAuth providers (Google, Microsoft)
- [ ] Implement password reset flow
- [ ] Set up email templates
- [ ] Create user migration scripts

### Phase 2: Backend Services (Weeks 5-8)

#### Week 5: API Routes Migration
```typescript
// app/api/v1/jobs/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      project:projects(*),
      financial_intents(*)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ jobs })
}
```

#### Week 6: Real-time Features
```typescript
// Real-time subscriptions
const channel = supabase
  .channel('time-tracking')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tracking_sessions',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received!', payload)
      updateUI(payload.new)
    }
  )
  .subscribe()
```

#### Week 7: Custom Microservices
- [ ] Accounting Integration Service (Node.js)
  - Xero webhook handlers
  - MYOB sync service
  - Invoice transformation
- [ ] Reporting Analytics Service
  - Complex financial queries
  - Business intelligence
  - Export functionality

#### Week 8: Storage Migration
- [ ] Migrate document storage to Supabase Storage
- [ ] Set up CDN for assets
- [ ] Implement file upload/download
- [ ] Configure access policies

### Phase 3: Frontend Migration (Weeks 9-11)

#### Week 9: Supabase Client Integration
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Week 10: Data Layer Refactoring
```typescript
// Before (Firebase)
const projectsRef = collection(db, 'orgs', orgId, 'projects')
const snapshot = await getDocs(projectsRef)

// After (Supabase)
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('org_id', orgId)
```

#### Week 11: UI Updates
- [ ] Update all data fetching hooks
- [ ] Migrate real-time subscriptions
- [ ] Update authentication flows
- [ ] Fix TypeScript types

### Phase 4: Testing & Deployment (Weeks 12-13)

#### Week 12: Testing
- [ ] Unit tests for data layer
- [ ] Integration tests for API
- [ ] E2E tests for critical flows
- [ ] Performance testing
- [ ] Security audit

#### Week 13: Production Deployment
- [ ] Data migration from Firebase
- [ ] DNS configuration
- [ ] SSL certificates
- [ ] Monitoring setup
- [ ] Go-live checklist

## Cost Comparison

### Firebase (Current Path)
```
Monthly Costs at 1000 businesses:
- Firestore: $3,000
- Functions: $1,500
- Storage: $400
- Total: $4,900/month ($58,800/year)
```

### Supabase (Future)
```
Monthly Costs at 1000 businesses:
- Database: $1,200
- Functions: $400
- Storage: $300
- Total: $1,900/month ($22,800/year)
- Savings: $36,000/year (62% reduction)
```

## Risk Mitigation

### Data Migration Strategy
1. **Parallel Run**: Keep Firebase running during migration
2. **Incremental Migration**: Migrate one entity type at a time
3. **Validation**: Comprehensive data validation at each step
4. **Rollback Plan**: Maintain Firebase backup for 30 days

### Team Preparation
1. **SQL Training**: Team upskilling on PostgreSQL
2. **Supabase Workshops**: Hands-on training sessions
3. **Documentation**: Comprehensive migration guides
4. **Support**: Dedicated migration support channel

## Success Metrics

### Technical Metrics
- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms
- [ ] 99.9% uptime
- [ ] Zero data loss during migration

### Business Metrics
- [ ] 60% cost reduction achieved
- [ ] User satisfaction maintained/improved
- [ ] No business disruption
- [ ] Compliance requirements met

## Go/No-Go Criteria

### Go Criteria
- ✅ All critical features migrated
- ✅ Performance benchmarks met
- ✅ Security audit passed
- ✅ Data integrity verified
- ✅ Rollback plan tested

### No-Go Criteria
- ❌ Data inconsistencies found
- ❌ Performance regression > 20%
- ❌ Security vulnerabilities discovered
- ❌ Critical features not working

## Team & Resources

### Core Team
- **Project Lead**: Overall coordination
- **Backend Engineer**: Database & API migration
- **Frontend Engineer**: UI integration
- **DevOps Engineer**: Infrastructure & deployment
- **QA Engineer**: Testing & validation

### External Resources
- Supabase support (Pro plan)
- PostgreSQL consultant (as needed)
- Security auditor (week 12)

## Next Immediate Steps

1. **Week 1 (Starting Now)**:
   - [ ] Create Supabase account
   - [ ] Set up development project
   - [ ] Install Supabase CLI
   - [ ] Create initial schema

2. **Proof of Concept**:
   ```bash
   # Install Supabase
   npm install @supabase/supabase-js @supabase/ssr
   
   # Set up environment
   cp .env.supabase.example .env.local
   
   # Start local development
   npx supabase start
   ```

3. **Validation**:
   - [ ] Create simple CRUD operations
   - [ ] Test authentication flow
   - [ ] Verify real-time subscriptions
   - [ ] Benchmark performance

## Communication Plan

### Stakeholder Updates
- Weekly progress reports
- Bi-weekly steering committee
- Migration dashboard (real-time progress)
- Slack channel: #supabase-migration

### User Communication
- 30-day advance notice
- Migration guide for users
- Training videos
- Support documentation

## Conclusion

The migration from Firebase to Supabase represents a critical strategic decision that will:
- **Reduce costs by 60%** ($36,000/year savings)
- **Improve performance by 10x** for financial queries
- **Enable compliance** with Australian regulations
- **Provide scalability** for growth to 10,000+ businesses

With proper planning and execution over 13 weeks, this migration will position Equanimity as a robust, cost-effective, and compliant business management platform ready for Australian market dominance.

---

**Status**: APPROVED ✅
**Start Date**: January 2025
**End Date**: March 2025
**Budget**: Development resources + $5,000 for tools/services
**ROI**: 6-month payback period

*For questions or updates, see `docs/ARCHITECTURE_DECISION_RECORD.md`*