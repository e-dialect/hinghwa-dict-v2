/**
 * Constants Package - Main Entry Point
 * 
 * This package provides shared constants for all Hinghwa Dictionary applications.
 * 
 * ## Structure
 * 
 * - `shared/` - Dialect-agnostic constants (API URLs, common config)
 * - `dialects/` - Dialect-specific data organized by dialect
 *   - `dialects/puxian/` - Puxian (莆仙话) dialect constants
 *   - Future: `dialects/fuzhou/`, `dialects/xiamen/`, etc.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Import shared constants
 * import { BASE_URL, API_ENDPOINTS } from 'constants/shared';
 * 
 * // Import dialect-specific constants
 * import { puxian } from 'constants/dialects/puxian';
 * // Or import specific items
 * import { counties, initials, tones } from 'constants/dialects/puxian';
 * 
 * // Dynamic dialect loading (for multi-dialect support)
 * const dialect = await import(`constants/dialects/${dialectName}`);
 * ```
 */

// Export shared constants
export * from '../shared';

// Export dialect constants
export { puxian } from '../dialects/puxian';

// For dynamic loading support
export const AVAILABLE_DIALECTS = ['puxian'] as const;
export type DialectName = typeof AVAILABLE_DIALECTS[number];

/**
 * Load dialect constants dynamically
 * Useful for applications that need to support multiple dialects
 */
export async function loadDialect(name: DialectName) {
  switch (name) {
    case 'puxian':
      return import('../dialects/puxian');
    default:
      throw new Error(`Unknown dialect: ${name}`);
  }
}
