/**
 * Puxian (莆仙话/兴化话) Dialect Constants
 * 
 * This module contains all constants specific to the Puxian dialect,
 * including geographic, phonological, and linguistic data.
 */

export * from './location';
export * from './phonology';
export * from './search';

// Re-export as a namespace for convenience
import * as location from './location';
import * as phonology from './phonology';
import * as search from './search';

export const puxian = {
  location,
  phonology,
  search,
};

export default puxian;
