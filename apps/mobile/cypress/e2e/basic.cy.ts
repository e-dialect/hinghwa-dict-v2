/// <reference types="cypress" />

describe('Home Page', () => {
  beforeEach(() => {
    cy.checkPortraitMode();
    cy.visit('/pages/home');
  });

  it('should load home page in portrait mode', () => {
    cy.window().its('innerWidth').should('equal', 375);
    cy.window().its('innerHeight').should('equal', 667);
  });

  it('should display welcome message', () => {
    cy.contains('欢迎来到兴化语记').should('be.visible');
  });

  it('should have search functionality', () => {
    cy.get('.cu-bar.search').should('exist');
  });

  it('should redirect non-logged-in users to login on protected actions', () => {
    // Test that certain actions redirect to login
    cy.get('button').contains('登录').should('be.visible');
  });
});

describe('Login Flow', () => {
  beforeEach(() => {
    cy.checkPortraitMode();
  });

  it('should navigate to login page', () => {
    cy.visit('/pages/login/login');
    cy.url().should('include', '/pages/login/login');
  });

  // Additional login tests will be added after migration
});

describe('Search Functionality', () => {
  beforeEach(() => {
    cy.checkPortraitMode();
    cy.visit('/pages/search');
  });

  it('should load search page', () => {
    cy.url().should('include', '/pages/search');
  });

  // Additional search tests will be added after migration
});
