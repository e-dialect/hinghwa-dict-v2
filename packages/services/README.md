# Services Package

This package provides shared services and API layer for the Hinghwa Dictionary applications.

## Structure

```
packages/services/
├── api/           # API request functions
├── types/         # TypeScript type definitions
├── src/           # Business logic and service layer
└── package.json
```

## Directory Organization

### `api/`
Contains low-level API request functions that interact with the backend. These functions handle HTTP requests and responses.

Example: `api/word.ts`, `api/user.ts`, etc.

### `types/`
Contains TypeScript type definitions:
- `pocketbase.ts` - Auto-generated types from PocketBase (using pocketbase-typegen)
- Custom type definitions for API requests/responses
- Shared data models

### `src/`
Contains business logic and higher-level service functions that:
- Use the API functions
- Transform data
- Provide convenient interfaces for components
- Handle caching, state management, etc.

## Migration Plan

The services are being migrated from the old Django-based backend API to the new PocketBase backend:

1. ✅ Set up directory structure
2. ⏳ Copy and convert existing services from JavaScript to TypeScript
3. ⏳ Create type definitions for current API responses
4. ⏳ Generate PocketBase types (when backend is ready)
5. ⏳ Gradually migrate API calls to use PocketBase SDK

## Usage

```typescript
// Import from the services package
import { getWordDetails, searchWords } from 'services';

// Use in your component
const word = await getWordDetails(123);
const results = await searchWords('兴化');
```

## Type Generation

Generate PocketBase types (when backend is available):

```bash
pnpm --filter services typegen
```

This will connect to the PocketBase instance and auto-generate TypeScript types.

## Development

The service layer is designed to be:
- **Type-safe**: Full TypeScript support
- **Modular**: Organized by domain (word, user, article, etc.)
- **Flexible**: Easy to switch between old and new API endpoints
- **Reusable**: Shared across web and mobile apps
