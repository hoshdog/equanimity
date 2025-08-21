# Architecture Decision Record: Backend Migration to Supabase

**Date:** December 2024  
**Status:** APPROVED  
**Decision:** Migrate from Firebase to Supabase with Hybrid Approach

## Context

The Equanimity project is an Australian business management platform targeting field service businesses as an alternative to SimPro and Xero. After comprehensive analysis, critical limitations in the Firebase architecture have been identified that prevent the platform from meeting business requirements.

## Current Issues with Firebase

### Critical Blockers
1. **NoSQL Limitations**: Cannot efficiently handle complex financial queries required for Australian tax reporting
2. **Cost Scaling**: Per-operation pricing model becomes expensive at 1000+ businesses (~$4,900/month)
3. **Compliance Gaps**: Limited audit trail capabilities for ISO-9001 compliance
4. **Authentication Issues**: Current implementation has configuration problems
5. **Data Sovereignty**: Limited control over Australian data residency

### Performance Issues
- Complex multi-tenant queries are inefficient
- No ACID transactions across collections
- Limited aggregation capabilities for financial reports
- 364KB bundle size with no code splitting

## Decision: Hybrid Supabase Architecture

After evaluating Firebase, Supabase, Custom Backend, and AWS Amplify, the decision is to migrate to a **Hybrid Architecture with Supabase as the core**.

### Chosen Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│                   Supabase Client SDK                    │
├─────────────────────────────────────────────────────────┤
│                      Supabase Core                       │
│  • PostgreSQL Database (Australian Region)               │
│  • Authentication & Authorization (RLS)                  │
│  • Real-time Subscriptions                              │
│  • File Storage                                         │
├─────────────────────────────────────────────────────────┤
│                   Custom Microservices                   │
│  • Accounting Integration Service (Xero/MYOB)           │
│  • Reporting & Analytics Service                        │
│  • AI Service (Google Genkit)                          │
└─────────────────────────────────────────────────────────┘
```

## Rationale

### Why Supabase?

1. **PostgreSQL Foundation**
   - Full SQL support for complex financial queries
   - ACID transactions for data integrity
   - Mature ecosystem with extensive tooling

2. **Cost Efficiency**
   - 60% cost reduction vs Firebase ($1,900/month vs $4,900/month at scale)
   - Predictable pricing model
   - Generous free tier for development

3. **Compliance & Security**
   - Row-level security for multi-tenancy
   - Australian data center (Sydney region)
   - Built-in audit logging
   - Field-level encryption support

4. **Developer Experience**
   - Familiar SQL mental model
   - Excellent TypeScript support
   - Built-in admin dashboard
   - Simple migration from Firebase

### Why Hybrid Approach?

1. **Best of Both Worlds**
   - Managed services for core functionality
   - Custom services for specialized business logic
   - Flexibility to optimize each component

2. **Risk Mitigation**
   - Incremental migration possible
   - Fallback options available
   - Reduced vendor lock-in

3. **Cost Optimization**
   - Use managed services where appropriate
   - Custom services only where needed
   - Scalable pricing model

## Migration Plan

### Phase 1: Foundation (4 weeks)
- Set up Supabase project in Sydney region
- Create PostgreSQL schema preserving data model
- Implement authentication system
- Set up row-level security policies

### Phase 2: Data Migration (3 weeks)
- Migrate core business entities
- Implement data validation
- Set up automated backups
- Create migration scripts

### Phase 3: Frontend Integration (3 weeks)
- Replace Firebase SDK with Supabase
- Update real-time subscriptions
- Implement new auth flows
- Update data access patterns

### Phase 4: Custom Services (3 weeks)
- Build accounting integration service
- Create reporting analytics API
- Maintain AI service with Genkit
- Implement monitoring

### Total Timeline: 13 weeks

## Cost Analysis

### Current (Firebase)
- Monthly: ~$400 (current) → $4,900 (at scale)
- Annual: $4,800 → $58,800

### Future (Supabase Hybrid)
- Monthly: ~$180 → $1,900 (at scale)
- Annual: $2,160 → $22,800
- **Annual Savings: $36,000 at scale**

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Migration data loss | Low | High | Comprehensive backup strategy, parallel run |
| Team learning curve | Medium | Medium | Training, documentation, gradual migration |
| Integration issues | Low | Medium | Maintain abstraction layer, thorough testing |
| Performance regression | Low | Low | Load testing, monitoring, optimization |

## Success Metrics

1. **Performance**
   - Financial reports 10x faster
   - Page load time <2 seconds
   - API response time <200ms

2. **Cost**
   - 60% reduction in infrastructure costs
   - Predictable monthly expenses
   - No surprise scaling costs

3. **Compliance**
   - Full audit trail capability
   - Australian data residency
   - ISO-9001 compliance ready

4. **Developer Velocity**
   - 40% faster feature development
   - 50% reduction in bug fix time
   - Improved debugging capability

## Implementation Team

- **Lead Developer**: Backend migration and schema design
- **Frontend Developer**: SDK integration and UI updates
- **DevOps Engineer**: Infrastructure and deployment
- **QA Engineer**: Testing and validation

## Review and Approval

### Stakeholders
- **Technical Lead**: Approved ✅
- **Product Owner**: Approved ✅
- **Finance**: Approved (cost savings) ✅
- **Compliance**: Approved (better audit) ✅

## Decision Outcome

**APPROVED**: Proceed with Supabase migration using hybrid architecture approach.

### Next Steps
1. Create Supabase project in Sydney region
2. Design PostgreSQL schema
3. Build proof of concept for core features
4. Create detailed migration checklist
5. Begin Phase 1 implementation

## Appendix: Detailed Comparison

### Database Capabilities

| Feature | Firebase | Supabase | Impact |
|---------|----------|----------|---------|
| Complex queries | ❌ Limited | ✅ Full SQL | Critical for reporting |
| ACID transactions | ❌ Document-level | ✅ Full support | Financial integrity |
| Aggregations | ❌ Client-side | ✅ Database-level | Performance |
| Joins | ❌ Not supported | ✅ Full support | Data relationships |
| Indexes | ⚠️ Limited | ✅ Comprehensive | Query performance |

### Compliance Features

| Requirement | Firebase | Supabase | Importance |
|-------------|----------|----------|------------|
| Australian hosting | ⚠️ Limited | ✅ Sydney region | High |
| Audit trails | ❌ Manual | ✅ Built-in | Critical |
| Data encryption | ⚠️ Basic | ✅ Field-level | High |
| GDPR compliance | ⚠️ Partial | ✅ Full | Medium |
| Backup strategy | ❌ Manual | ✅ Automated | Critical |

### Development Experience

| Aspect | Firebase | Supabase | Impact |
|--------|----------|----------|---------|
| Learning curve | Medium | Low (SQL) | Team productivity |
| Documentation | ✅ Excellent | ✅ Good | Development speed |
| TypeScript | ✅ Good | ✅ Excellent | Code quality |
| Debugging | ❌ Difficult | ✅ SQL tools | Issue resolution |
| Testing | ⚠️ Complex | ✅ Standard | Quality assurance |

---

*This ADR represents a critical architectural decision that will improve performance, reduce costs, and enable compliance with Australian business requirements.*