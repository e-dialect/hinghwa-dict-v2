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
├── services/      # API services (being migrated to packages/services)
├── utils/         # Utility functions
├── colorui/       # ColorUI library
├── routers/       # Route configurations
├── const/         # Constants
├── App.vue        # Root component
├── main.js        # Entry point
├── manifest.json  # App configuration
└── pages.json     # Page routes configuration
```

## Migration Notes

This module was migrated from [hinghwa-dict-uni-app](https://github.com/e-dialect/hinghwa-dict-uni-app) repository.

The API services are being gradually migrated to `packages/services` with TypeScript support and will be refactored to use PocketBase SDK in the future.

## Original Repository

- GitHub: https://github.com/e-dialect/hinghwa-dict-uni-app
- Web: https://m.pxm.edialect.top
- Main Site: https://pxm.edialect.top

## License

This project is part of the E方言 (E-Dialect) platform.
