# Cypress E2E Testing for Mobile App

## Overview

This directory contains end-to-end tests for the mobile application using Cypress with **portrait mode (竖屏) configuration**.

## Configuration

- **Viewport**: 375x667 (iPhone portrait mode)
- **Base URL**: http://localhost:3000
- **Video Recording**: Enabled
- **Screenshots**: Enabled on failure
- **Retries**: 2 attempts in CI mode

## Directory Structure

```
cypress/
├── e2e/                  # E2E test files
│   └── basic.cy.ts       # Basic navigation tests
├── fixtures/             # Test data
│   └── test-data.json    # Mock data for tests
├── support/              # Support files
│   ├── commands.ts       # Custom Cypress commands
│   └── e2e.ts           # Global configuration
└── screenshots/          # Auto-generated screenshots
```

## Custom Commands

### cy.login(username, password)
Login helper command
```typescript
cy.login('testuser', 'password');
```

### cy.selectDialect(dialectName)
Select a dialect from the dialect selector
```typescript
cy.selectDialect('莆田城里');
```

### cy.waitForApi()
Wait for API responses to complete
```typescript
cy.waitForApi();
```

### cy.checkPortraitMode()
Verify the viewport is in portrait mode (375x667)
```typescript
cy.checkPortraitMode();
```

## Running Tests

### Local Development

```bash
# Install dependencies
pnpm install

# Open Cypress GUI
pnpm test:e2e:open
# or
pnpm cypress:open

# Run tests headlessly
pnpm test:e2e
```

### Docker

```bash
# Run all tests in Docker
docker-compose -f docker-compose.test.yml up cypress

# View results
ls -la cypress-results/
```

## Writing Tests

### Basic Test Structure

```typescript
describe('Page Name', () => {
  beforeEach(() => {
    cy.checkPortraitMode();
    cy.visit('/pages/your-page');
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

### Portrait Mode Requirement

All pages must be tested in portrait mode (375x667). The app redirects to an error page if accessed in landscape mode.

```typescript
beforeEach(() => {
  cy.checkPortraitMode(); // Always call this
});
```

### Testing with API

```typescript
it('should load data from API', () => {
  cy.intercept('GET', '/api/words/*').as('getWord');
  cy.visit('/pages/words/details?id=123');
  cy.wait('@getWord');
  cy.get('.word-content').should('be.visible');
});
```

### Testing Dialect Functionality

```typescript
it('should change dialect', () => {
  cy.selectDialect('仙游城关');
  cy.get('[data-dialect="xianyou-city"]').should('be.visible');
});
```

## Test Data

Mock data is stored in `cypress/fixtures/test-data.json`:

```json
{
  "testUser": {
    "username": "testuser",
    "password": "TestPassword123!"
  },
  "testWords": [...],
  "testDialects": [...]
}
```

Load fixtures in tests:

```typescript
cy.fixture('test-data').then((data) => {
  cy.login(data.testUser.username, data.testUser.password);
});
```

## CI/CD Integration

Tests run automatically in CI using Docker:

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Debugging

### View Test Videos

Videos are saved in `cypress/videos/` after each test run.

### View Screenshots

Screenshots of failures are in `cypress/screenshots/`.

### Interactive Mode

```bash
pnpm cypress:open
```

## Best Practices

1. **Always check portrait mode** with `cy.checkPortraitMode()`
2. **Use data-cy attributes** for stable selectors
3. **Wait for API responses** with `cy.waitForApi()` or `cy.wait('@alias')`
4. **Clean state between tests** (done automatically in beforeEach)
5. **Use fixtures** for consistent test data
6. **Test error states** and edge cases
7. **Keep tests independent** - don't rely on test order

## Coverage

Target: 80% coverage of all migrated pages

- ✅ Basic navigation tests
- 🔄 Login/auth tests (in progress)
- 🔄 Search tests (in progress)
- 🔄 Word detail tests (in progress)
- ⏳ Full page coverage (57 pages)

## Troubleshooting

### Viewport issues
If tests fail due to viewport, ensure `cy.checkPortraitMode()` is called in `beforeEach`.

### API timeouts
Increase wait time in `cy.waitForApi()` or use specific intercepts.

### Element not found
Use data-cy attributes or wait for elements:
```typescript
cy.get('[data-cy=element]', { timeout: 10000 }).should('exist');
```
