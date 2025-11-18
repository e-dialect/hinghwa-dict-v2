// Import commands.ts using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global before hook
beforeEach(() => {
  // Check portrait mode
  cy.viewport(375, 667);
  
  // Clear storage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Only for specific known exceptions
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});
