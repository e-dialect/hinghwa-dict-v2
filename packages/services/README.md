# Services Package

This package provides shared services and API layer for the Hinghwa Dictionary applications.

**Current Status**: This package is prepared for future use. The mobile app (`apps/mobile`) currently uses its own services located in `apps/mobile/src/services/` which will remain until the PocketBase migration is complete.

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

This package is being prepared for the PocketBase backend migration:

1. ✅ Set up directory structure
2. ✅ Create base TypeScript structure and types
3. ⏳ Wait for PocketBase backend to be ready
4. ⏳ Generate PocketBase types (when backend is available)
5. ⏳ Implement services using PocketBase SDK
6. ⏳ Migrate apps to use this shared package (replacing app-specific services)

**Note**: Currently, `apps/mobile` uses its own Django-based services in `apps/mobile/src/services/`. These will be replaced with this package once the PocketBase migration is complete.

## Usage (Future)

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
