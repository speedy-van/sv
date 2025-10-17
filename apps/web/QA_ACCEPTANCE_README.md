# QA & Acceptance Testing - Admin Dashboard

This document outlines the comprehensive QA & Acceptance testing implementation for the Speedy Van Admin Dashboard, following the requirements specified in the cursor tasks.

## Overview

The QA & Acceptance testing suite ensures that the admin dashboard meets all performance, security, and functional requirements before production deployment.

## Test Suites

### 1. Admin Dashboard Acceptance Tests (`admin-dashboard-acceptance.spec.ts`)

**Purpose**: End-to-end testing of core admin dashboard functionality

**Key Test Scenarios**:

- ✅ **Dashboard KPIs under 1 second TTI**
- ✅ **Filter 10k orders and bulk assign with atomic success**
- ✅ **Approve driver → can claim jobs; suspend → cannot**
- ✅ **Issue partial refund → Stripe webhook sync → finance view updated**
- ✅ **Change pricing → new quotes reflect version after `effectiveAt`**
- ✅ **Role-based access control enforcement**
- ✅ **Real-time updates and performance**
- ✅ **Audit trail and compliance**

### 2. Admin Dashboard Performance Tests (`admin-performance.spec.ts`)

**Purpose**: Performance benchmarking and optimization validation

**Performance Targets**:

- Dashboard load time: < 1 second TTI
- List interactions: < 100ms
- Map load time: < 2 seconds with 200 markers
- Real-time updates: < 100ms perceived
- Bulk operations: < 500ms
- Complex filtering: < 200ms

**Test Coverage**:

- Dashboard load performance
- Order list interactions
- Map rendering with multiple markers
- Bulk operations performance
- Real-time update responsiveness
- Large dataset filtering
- KPI accuracy and live data
- Admin shell responsiveness
- Concurrent operations handling

### 3. Admin Dashboard Security Tests (`admin-security.spec.ts`)

**Purpose**: Security validation and vulnerability prevention

**Security Checks**:

- ✅ **2FA for admin access**
- ✅ **Least-privilege role enforcement**
- ✅ **SSRF attack prevention**
- ✅ **CSRF protection**
- ✅ **Audit trail without secrets**
- ✅ **Session timeout enforcement**
- ✅ **IP allowlist for high-risk actions**
- ✅ **Unauthorized API access prevention**
- ✅ **Input sanitization**
- ✅ **Secure headers enforcement**
- ✅ **File upload validation**

## Running the Tests

### Individual Test Suites

```bash
# Run acceptance tests
npm run test:admin-acceptance

# Run performance tests
npm run test:admin-performance

# Run security tests
npm run test:admin-security
```

### Complete QA & Acceptance Suite

```bash
# Run all QA & Acceptance tests with comprehensive reporting
npm run test:qa-acceptance
```

### All Tests (Including Unit and E2E)

```bash
# Run complete test suite
npm run test:all
```

## Test Reports

The QA & Acceptance test runner generates comprehensive reports:

### JSON Report

- Location: `test-results/qa-acceptance-report.json`
- Contains detailed test results, performance metrics, and security checks
- Machine-readable format for CI/CD integration

### HTML Report

- Location: `test-results/qa-acceptance-report.html`
- Beautiful, interactive dashboard with test results
- Performance metrics visualization
- Security check status
- Acceptance criteria validation

## Acceptance Criteria

### Performance Requirements

| Metric            | Target      | Test                                                |
| ----------------- | ----------- | --------------------------------------------------- |
| Dashboard TTI     | < 1 second  | `dashboard should load under 1 second TTI`          |
| List Interactions | < 100ms     | `orders list interactions should be under 100ms`    |
| Map Load Time     | < 2 seconds | `map should load under 2 seconds with 200 markers`  |
| Real-time Updates | < 100ms     | `real-time updates should be under 100ms perceived` |
| Bulk Operations   | < 500ms     | `bulk operations should be atomic and fast`         |
| Complex Filtering | < 200ms     | `large dataset filtering should be under 200ms`     |

### Security Requirements

| Requirement            | Test                                   |
| ---------------------- | -------------------------------------- |
| 2FA Required           | `should require 2FA for admin access`  |
| Role-Based Access      | `should enforce least-privilege roles` |
| CSRF Protection        | `should prevent CSRF attacks`          |
| Input Sanitization     | `should sanitize user inputs`          |
| Secure Headers         | `should enforce secure headers`        |
| File Upload Validation | `should validate file uploads`         |

### Functional Requirements

| Requirement            | Test                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Atomic Bulk Assignment | `should filter 10k orders and bulk assign with atomic success` |
| Driver Approval Flow   | `should approve driver and verify they can claim jobs`         |
| Driver Suspension      | `should suspend driver and verify they cannot claim jobs`      |
| Refund Processing      | `should issue partial refund and verify Stripe webhook sync`   |
| Pricing Versioning     | `should change pricing and verify new quotes reflect version`  |
| Audit Trail            | `should verify audit trail and compliance`                     |

## Test Data Requirements

### Admin Users

- `admin@speedy-van.co.uk` - Full admin access
- `limited-admin@speedy-van.co.uk` - Limited permissions for RBAC testing

### Test Drivers

- `test-driver@speedy-van.co.uk` - Active driver for testing
- Various driver applications for approval testing

### Test Orders

- Completed orders for refund testing
- Assigned orders for bulk operations
- Orders in various states for filtering tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: QA & Acceptance Tests
on: [push, pull_request]
jobs:
  qa-acceptance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run prisma:generate
      - run: npm run db:seed
      - run: npm run test:qa-acceptance
      - uses: actions/upload-artifact@v3
        with:
          name: qa-acceptance-report
          path: test-results/
```

### Pre-deployment Checklist

Before deploying to production, ensure:

1. ✅ All QA & Acceptance tests pass
2. ✅ Performance metrics meet targets
3. ✅ Security checks pass
4. ✅ Acceptance criteria validated
5. ✅ HTML report reviewed
6. ✅ No critical vulnerabilities detected

## Troubleshooting

### Common Issues

**Tests failing due to missing test data**

```bash
# Ensure test data is seeded
npm run db:seed
```

**Performance tests timing out**

```bash
# Increase timeout in playwright.config.ts
timeout: 30000
```

**Security tests failing**

```bash
# Check environment variables
echo $STRIPE_SECRET_KEY
echo $PUSHER_KEY
```

### Debug Mode

```bash
# Run tests in debug mode
npm run test:admin-acceptance -- --debug
```

## Performance Monitoring

### Key Metrics to Monitor

1. **Dashboard Load Time**: Should remain under 1 second
2. **API Response Times**: Monitor `/api/admin/*` endpoints
3. **Database Query Performance**: Monitor slow queries
4. **Real-time Update Latency**: Monitor Pusher event delivery
5. **Memory Usage**: Monitor for memory leaks

### Performance Alerts

Set up alerts for:

- Dashboard load time > 1.5 seconds
- API response time > 500ms
- Database query time > 100ms
- Real-time update latency > 200ms

## Security Monitoring

### Security Alerts

Set up alerts for:

- Failed 2FA attempts
- Unauthorized admin access attempts
- Suspicious file uploads
- CSRF token failures
- IP allowlist violations

### Regular Security Audits

- Monthly security test runs
- Quarterly penetration testing
- Annual security review
- Continuous vulnerability scanning

## Contributing

### Adding New Tests

1. Follow the existing test structure
2. Use descriptive test names
3. Include performance assertions where relevant
4. Add security checks for new features
5. Update this README with new test descriptions

### Test Data Management

1. Use isolated test data
2. Clean up after tests
3. Use realistic but safe test data
4. Document test data requirements

## Support

For questions about QA & Acceptance testing:

1. Check the test logs in `test-results/`
2. Review the HTML report for detailed results
3. Check the console output for performance metrics
4. Contact the development team for assistance

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Speedy Van Technical Team

---

## 👥 Development Team

* **Lead Developer:** *Mr. Ahmad Alwakai*
* **Team:** *Speedy Van Technical Team* (internal full-stack engineers, backend specialists, and mobile developers)
* **Core Stack:** Next.js, Node.js, TypeScript, Prisma, PostgreSQL, Expo (React Native), Chakra UI
* **Infrastructure:** Neon (PostgreSQL), Render (hosting), Stripe (payments), Pusher (real-time), ZeptoMail (email)

**Support:** support@speedy-van.co.uk | +44 7901 846297
