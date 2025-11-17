# Constants Package

Shared constants for all Hinghwa Dictionary applications, organized to support multiple dialects while maintaining a clean separation between shared and dialect-specific data.

**Current Status**: This package is prepared for future use with multi-dialect support. The mobile app (`apps/mobile`) currently uses its own constants located in `apps/mobile/src/const/` which will remain until the multi-dialect refactor is implemented.

## 📁 Structure

```
packages/constants/
├── shared/              # Dialect-agnostic constants
│   ├── urls.ts         # API endpoints, CDN URLs
│   └── index.ts        # Shared exports
├── dialects/           # Dialect-specific data
│   └── puxian/         # Puxian (莆仙话/兴化话) dialect
│       ├── location.ts     # Geographic data (counties, towns)
│       ├── phonology.ts    # Phonetic system (initials, finals, tones)
│       ├── search.ts       # Search/filter constants
│       └── index.ts        # Puxian exports
├── src/
│   └── index.ts        # Main entry point
└── package.json
```

## 🎯 Design Philosophy

### Multi-Dialect Support

The package is designed to support multiple Chinese dialects in the future:

- **Shared constants**: API URLs, configuration values that apply to all dialects
- **Dialect-specific constants**: Phonology, geography, and linguistic data unique to each dialect
- **Dynamic loading**: Ability to load dialect data at runtime based on user selection

### Extensibility

Adding a new dialect is straightforward:

1. Create a new directory under `dialects/` (e.g., `dialects/fuzhou/`)
2. Add dialect-specific files (location, phonology, etc.)
3. Create an `index.ts` that exports all dialect data
4. Update the main `src/index.ts` to include the new dialect

## 📖 Usage

### Import Shared Constants

```typescript
import { BASE_URL, API_ENDPOINTS, DEFAULT_ARTICLE_COVER } from 'constants/shared';

// Use in your API calls
const response = await fetch(`${BASE_URL}${API_ENDPOINTS.WORDS}`);
```

### Import Dialect-Specific Constants

```typescript
// Import entire dialect
import { puxian } from 'constants';
console.log(puxian.location.counties); // ['城厢区', '涵江区', ...]
console.log(puxian.phonology.initials); // Phonetic initials data

// Import specific items
import { counties, initials, tones } from 'constants/dialects/puxian';
```

### Dynamic Dialect Loading

For applications that need to support multiple dialects:

```typescript
import { loadDialect, AVAILABLE_DIALECTS } from 'constants';

// Load dialect dynamically based on user selection
const dialectName = getUserSelectedDialect(); // 'puxian', 'fuzhou', etc.
const dialect = await loadDialect(dialectName);

// Use loaded dialect data
console.log(dialect.location.counties);
console.log(dialect.phonology.initials);
```

## 📊 Data Categories

### Shared Constants

- **URLs**: API base URLs (production/development), CDN URLs
- **API Endpoints**: Standard REST endpoints for words, users, articles, etc.
- **Common Config**: Default values, resource paths

### Puxian Dialect Constants

#### Location Data
- **Counties**: Administrative divisions (区/县)
- **Towns**: Townships and streets under each county
- **Dialect Info**: Metadata (names, region, ISO code)

#### Phonology
- **Initials (声母)**: Consonants that begin syllables
- **Finals (韵母)**: Vowel endings, categorized as:
  - Open finals (开尾韵): End in vowels
  - Nasal finals (鼻尾韵): End in nasal consonants
  - Stop finals (塞尾韵): End in stop consonants
- **Tones (声调)**: 7 tones with IPA notation

#### Search Constants
- Initial consonant filters (for dictionary search)
- Final vowel hierarchy (for dropdown selectors)

## 🔄 Migration from Old Structure

The constants from `apps/mobile/src/const/` have been reorganized here with enhancements:

1. **Converted to TypeScript** with proper type definitions
2. **Organized by concern** (shared vs. dialect-specific)
3. **Enhanced with metadata** (dialect info, IPA notation)
4. **Made reusable** across all frontend applications

**Note**: The mobile app currently still uses `apps/mobile/src/const/` and will continue to do so until the multi-dialect refactor. This package serves as the prepared structure for future migration.

### Compatibility

The new structure maintains backward compatibility through default exports:

```typescript
// Old import (still works)
import shengYunDiao from 'constants/dialects/puxian/phonology';
console.log(shengYunDiao.shengmu); // Same as old structure

// New import (recommended)
import { initials, openFinals, tones } from 'constants/dialects/puxian/phonology';
```

## 🚀 Future Dialects

To add support for other Min dialects or Chinese varieties:

```typescript
// dialects/fuzhou/index.ts
export const fuzhou = {
  location: { ... },
  phonology: { ... },
  search: { ... },
};

// dialects/xiamen/index.ts
export const xiamen = {
  location: { ... },
  phonology: { ... },
  search: { ... },
};
```

Then update `src/index.ts`:

```typescript
export const AVAILABLE_DIALECTS = ['puxian', 'fuzhou', 'xiamen'] as const;

export async function loadDialect(name: DialectName) {
  switch (name) {
    case 'puxian': return import('../dialects/puxian');
    case 'fuzhou': return import('../dialects/fuzhou');
    case 'xiamen': return import('../dialects/xiamen');
    // ...
  }
}
```

## 💡 Use Cases

1. **Dictionary Search**: Use phonology constants for phonetic search filters
2. **User Location**: Use location data for regional preferences
3. **API Configuration**: Use shared URL constants for consistent API access
4. **Multi-dialect Apps**: Use dynamic loading to support multiple dialects
5. **Phonetic Input**: Use search constants for input method editors

## 📝 Type Safety

All constants are fully typed with TypeScript interfaces:

```typescript
interface PhoneticItem {
  key: number;
  pinyin: string;
  IPA: string;
  example: string;
}

const initials: PhoneticItem[] = [
  { key: 0, pinyin: 'b', IPA: 'p', example: '布 bou4 班 bang1' },
  // ...
];
```

This ensures type safety when using constants throughout your application.
