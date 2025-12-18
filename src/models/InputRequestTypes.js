/**
 * @fileoverview InputRequestTypes - Input request type enumeration
 */

/**
 * Input request types
 * @enum {string}
 * @readonly
 */
export const InputRequestType = Object.freeze({
  TEXT: 'TEXT',              // Free-form text input
  CHOICE: 'CHOICE',          // Single choice from options
  MULTI_CHOICE: 'MULTI_CHOICE', // Multiple choices
  CONFIRMATION: 'CONFIRMATION',  // Yes/No confirmation
  NUMBER: 'NUMBER',          // Numeric input
  DATE: 'DATE',              // Date input
  FILE: 'FILE',              // File upload (future)
});

/**
 * Input validation types
 * @enum {string}
 * @readonly
 */
export const ValidationType = Object.freeze({
  REQUIRED: 'REQUIRED',
  MIN_LENGTH: 'MIN_LENGTH',
  MAX_LENGTH: 'MAX_LENGTH',
  PATTERN: 'PATTERN',
  RANGE: 'RANGE',
  CUSTOM: 'CUSTOM',
});
