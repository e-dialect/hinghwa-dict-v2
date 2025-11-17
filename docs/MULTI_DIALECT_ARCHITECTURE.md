# Multi-Dialect Architecture Guide

This guide explains how to structure your application to support multiple Chinese dialects while maintaining code reusability.

**Status**: This document describes the **future architecture** for multi-dialect support. Currently, the mobile app uses its own constants and services. This structure will be implemented during the PocketBase migration.

## 🎯 Design Principles

### 1. Separation of Concerns

- **Generic logic**: Components and services that work for any dialect
- **Dialect-specific data**: Constants, configurations, and content unique to each dialect
- **Dynamic loading**: Load dialect-specific data at runtime based on user selection

### 2. Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│  Pages & Components (UI Layer)         │
│  - Generic layouts                      │
│  - Reusable components                  │
│  - Dialect-aware wrappers               │
└─────────────────────────────────────────┘
           ↓ uses
┌─────────────────────────────────────────┐
│  Services & API Layer                   │
│  - Generic API calls                    │
│  - Data transformation                  │
│  - Dialect parameter injection          │
└─────────────────────────────────────────┘
           ↓ uses
┌─────────────────────────────────────────┐
│  Constants & Config (Data Layer)       │
│  - Shared constants                     │
│  - Dialect-specific constants           │
│  - Dynamic dialect loading              │
└─────────────────────────────────────────┘
```

## 📦 Package Organization

### Constants Package (`packages/constants`)

Prepared structure for multi-dialect support:

```typescript
// Shared constants (all dialects)
import { BASE_URL, API_ENDPOINTS } from 'constants/shared';

// Dialect-specific constants
import { puxian } from 'constants/dialects/puxian';
// Future: import { fuzhou } from 'constants/dialects/fuzhou';

// Dynamic loading
import { loadDialect } from 'constants';
const dialect = await loadDialect(userSelectedDialect);
```

**Note**: Mobile app currently uses `apps/mobile/src/const/`. This package will be adopted during PocketBase migration.

### Services Package (`packages/services`)

**Current structure** (prepared for future):
```
packages/services/
├── api/           # API request functions
├── types/         # Type definitions
└── src/           # Business logic
```

**Note**: Mobile app currently uses `apps/mobile/src/services/`. This package will be adopted during PocketBase migration.

**Recommended multi-dialect structure** (for future implementation):
```
packages/services/
├── api/
│   ├── base.ts          # Core request utilities
│   ├── word.ts          # Word API (dialect-agnostic)
│   ├── user.ts          # User API
│   └── dialect.ts       # NEW: Dialect switching API
├── types/
│   ├── index.ts         # Generic types
│   ├── dialect.ts       # NEW: Dialect-specific types
│   └── pocketbase.ts    # Auto-generated
└── src/
    ├── context.ts       # NEW: Dialect context manager
    ├── word.service.ts  # Business logic with dialect awareness
    └── index.ts
```

## 🔧 Implementation Patterns

### Pattern 1: Dialect Context

Create a context/store to manage the current dialect:

```typescript
// packages/services/src/context.ts
import type { DialectName } from 'constants';

class DialectContext {
  private currentDialect: DialectName = 'puxian';
  private dialectData: any = null;

  async setDialect(name: DialectName) {
    const { loadDialect } = await import('constants');
    this.currentDialect = name;
    this.dialectData = await loadDialect(name);
    return this.dialectData;
  }

  getDialect() {
    return this.currentDialect;
  }

  getDialectData() {
    return this.dialectData;
  }
}

export const dialectContext = new DialectContext();
```

### Pattern 2: Dialect-Aware Services

Inject dialect information into API calls:

```typescript
// packages/services/src/word.service.ts
import { api } from '../api/base';
import { dialectContext } from './context';

export class WordService {
  async searchWords(keyword: string, filters?: PhoneticFilters) {
    const dialect = dialectContext.getDialect();
    
    return api.get('/words', {
      search: keyword,
      dialect: dialect, // Include dialect in request
      ...filters,
    });
  }
}
```

### Pattern 3: Generic Components with Dialect Slots

Create components that accept dialect-specific content as props/slots.

### Pattern 4: Page Organization

Organize pages to separate generic and dialect-specific concerns:

```
apps/mobile/src/pages/
├── common/              # Generic pages (work for all dialects)
│   ├── home.vue
│   └── search.vue
├── words/              # Word-related pages (generic structure)
│   ├── details.vue
│   └── list.vue
└── dialect-specific/   # NEW: Dialect-specific pages
    └── puxian/
        └── about.vue
```

## 📝 Migration Strategy

### Phase 1: Extract Constants (✅ Done)
- Move constants from `apps/mobile/src/const/` to `packages/constants/`
- Organize by shared vs. dialect-specific
- Add TypeScript types

### Phase 2: Update Services Layer
- Add dialect context to services
- Update API calls to include dialect parameter

### Phase 3: Refactor Components
- Use dialect context instead of hardcoded imports
- Make components dialect-aware

### Phase 4: Update Backend API
- Add `dialect` parameter to relevant endpoints
- Return dialect-specific data based on parameter

## 🚀 Adding a New Dialect

1. Create constants in `packages/constants/dialects/<dialect-name>/`
2. Update `AVAILABLE_DIALECTS` in constants index
3. Add dialect-specific pages if needed
4. Test with dialect selector

## 💡 Best Practices

1. **Keep generic code generic**: Don't hardcode dialect-specific values
2. **Use constants package**: Always import from `packages/constants`
3. **Centralize dialect context**: Use as single source of truth
4. **Type everything**: Use TypeScript interfaces
5. **Lazy load**: Only load dialect data when needed
6. **Cache dialect data**: Avoid reloading on every mount

For complete examples and patterns, see the full guide in the repository.
