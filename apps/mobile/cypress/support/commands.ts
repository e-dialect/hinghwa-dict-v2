/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      selectDialect(dialectName: string): Chainable<void>;
      waitForApi(): Chainable<void>;
      checkPortraitMode(): Chainable<void>;
    }
  }
}

/**
 * Login command
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/pages/login/login');
  cy.get('[data-cy=username]').type(username);
  cy.get('[data-cy=password]').type(password);
  cy.get('[data-cy=submit]').click();
  cy.waitForApi();
});

/**
 * Select dialect command
 */
Cypress.Commands.add('selectDialect', (dialectName: string) => {
  cy.get('[data-cy=dialect-selector]').click();
  cy.contains(dialectName).click();
});

/**
 * Wait for API response
 */
Cypress.Commands.add('waitForApi', () => {
  cy.wait(1000); // Basic wait, can be improved with intercepts
});

/**
 * Check portrait mode
 */
Cypress.Commands.add('checkPortraitMode', () => {
  cy.viewport(375, 667);
  cy.window().its('innerWidth').should('equal', 375);
  cy.window().its('innerHeight').should('equal', 667);
});

export {};
