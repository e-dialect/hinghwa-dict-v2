# 兴化语记 Mobile App

This is the mobile application module for 兴化语记 (Hinghwa Dictionary), built with uni-app framework.

## About

兴化语记 is a comprehensive dictionary and language tool for the Hinghwa (Puxian) dialect, serving speakers in Putian, Fujian Province and surrounding areas.

This uni-app project enables deployment to multiple platforms:
- H5 (Web)
- WeChat Mini Program (微信小程序)
- Android/iOS Apps
- Other mini-program platforms

## Technology Stack

- **Framework**: uni-app 3.x
- **Build Tool**: Vite
- **Frontend**: Vue 3
- **State Management**: Vuex
- **UI Components**: ColorUI, uni-ui
- **Styling**: SCSS

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start H5 development server
pnpm --filter mobile dev

# Build for H5
pnpm --filter mobile build

# Build for WeChat Mini Program
pnpm --filter mobile dev:mp-weixin
pnpm --filter mobile build:mp-weixin

# Build for App
pnpm --filter mobile dev:app
pnpm --filter mobile build:app
```

## Project Structure

```
src/
├── components/     # Reusable Vue components
├── pages/         # Page components
├── services/      # API services (mobile-specific, will be replaced during PocketBase migration)
├── utils/         # Utility functions
├── colorui/       # ColorUI library
├── routers/       # Route configurations
├── const/         # Constants (mobile-specific, shared constants are in packages/constants)
├── App.vue        # Root component
├── main.js        # Entry point
├── manifest.json  # App configuration
└── pages.json     # Page routes configuration
```

## Migration Notes

This module was migrated from [hinghwa-dict-uni-app](https://github.com/e-dialect/hinghwa-dict-uni-app) repository.

### Current State

- **Services**: The mobile app currently uses its own API services in `src/services/`. These are Django-based APIs that will remain until the PocketBase migration is complete.
- **Constants**: The mobile app uses its own constants in `src/const/`. Shared constants for future use are available in `packages/constants` but are not yet integrated.

### Future Migration Path

When the PocketBase backend is ready:
1. The old services in `src/services/` will be replaced with PocketBase SDK calls from `packages/services`
2. Constants will be migrated to use `packages/constants` for better code sharing across apps
3. The old Django-based API code will be removed

For now, the mobile app remains self-contained and fully functional with its existing structure.

## Original Repository

- GitHub: https://github.com/e-dialect/hinghwa-dict-uni-app
- Web: https://m.pxm.edialect.top
- Main Site: https://pxm.edialect.top

## License

This project is part of the E方言 (E-Dialect) platform.
