/**
 * @fileoverview InputRequest - Model for user input requests
 * Represents a request for user input during task execution.
 */

import { InputRequestType, ValidationType } from './InputRequestTypes.js';

/**
 * Input request model
 * @class
 */
export default class InputRequest {
  /**
   * @param {Object} config - Request configuration
   * @param {string} config.type - Request type (from InputRequestType)
   * @param {string} config.prompt - User-facing prompt text
   * @param {Object} [config.options] - Type-specific options
   * @param {Array} [config.validation] - Validation rules
   * @param {Object} [config.metadata] - Additional metadata
   */
  constructor({ type, prompt, options = {}, validation = [], metadata = {} }) {
    if (!Object.values(InputRequestType).includes(type)) {
      throw new Error(`Invalid input request type: ${type}`);
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    this.id = `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.prompt = prompt;
    this.options = options;
    this.validation = validation;
    this.metadata = {
      createdAt: new Date().toISOString(),
      ...metadata,
    };
    this.response = null;
    this.respondedAt = null;
    this.status = 'pending'; // pending, responded, cancelled
  }

  /**
   * Validate user input
   * @param {*} input - User input to validate
   * @returns {{valid: boolean, errors: Array<string>}} Validation result
   */
  validate(input) {
    const errors = [];

    // Type-specific validation
    switch (this.type) {
      case InputRequestType.TEXT:
        if (typeof input !== 'string') {
          errors.push('Input must be a string');
        }
        break;

      case InputRequestType.CHOICE:
        if (!this.options.choices || !this.options.choices.includes(input)) {
          errors.push(`Input must be one of: ${this.options.choices.join(', ')}`);
        }
        break;

      case InputRequestType.MULTI_CHOICE:
        if (!Array.isArray(input)) {
          errors.push('Input must be an array');
        } else if (this.options.choices) {
          const invalid = input.filter(i => !this.options.choices.includes(i));
          if (invalid.length > 0) {
            errors.push(`Invalid choices: ${invalid.join(', ')}`);
          }
        }
        break;

      case InputRequestType.CONFIRMATION:
        if (typeof input !== 'boolean') {
          errors.push('Input must be boolean (true/false)');
        }
        break;

      case InputRequestType.NUMBER:
        if (typeof input !== 'number' || isNaN(input)) {
          errors.push('Input must be a valid number');
        }
        break;
    }

    // Apply validation rules
    for (const rule of this.validation) {
      const ruleError = this._applyValidationRule(input, rule);
      if (ruleError) errors.push(ruleError);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply single validation rule
   * @private
   */
  _applyValidationRule(input, rule) {
    switch (rule.type) {
      case ValidationType.REQUIRED:
        if (!input || (typeof input === 'string' && input.trim() === '')) {
          return rule.message || 'Input is required';
        }
        break;

      case ValidationType.MIN_LENGTH:
        if (typeof input === 'string' && input.length < rule.value) {
          return rule.message || `Minimum length is ${rule.value}`;
        }
        break;

      case ValidationType.MAX_LENGTH:
        if (typeof input === 'string' && input.length > rule.value) {
          return rule.message || `Maximum length is ${rule.value}`;
        }
        break;

      case ValidationType.PATTERN:
        if (typeof input === 'string' && !new RegExp(rule.value).test(input)) {
          return rule.message || `Input must match pattern: ${rule.value}`;
        }
        break;

      case ValidationType.RANGE:
        if (typeof input === 'number') {
          if (rule.min !== undefined && input < rule.min) {
            return rule.message || `Minimum value is ${rule.min}`;
          }
          if (rule.max !== undefined && input > rule.max) {
            return rule.message || `Maximum value is ${rule.max}`;
          }
        }
        break;

      case ValidationType.CUSTOM:
        if (rule.validator && !rule.validator(input)) {
          return rule.message || 'Input failed custom validation';
        }
        break;
    }

    return null;
  }

  /**
   * Set response
   * @param {*} input - User input
   * @returns {{valid: boolean, errors: Array<string>}} Validation result
   */
  setResponse(input) {
    const validationResult = this.validate(input);
    
    if (validationResult.valid) {
      this.response = input;
      this.respondedAt = new Date().toISOString();
      this.status = 'responded';
    }

    return validationResult;
  }

  /**
   * Cancel request
   */
  cancel() {
    this.status = 'cancelled';
  }

  /**
   * Check if responded
   * @returns {boolean}
   */
  isResponded() {
    return this.status === 'responded';
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      prompt: this.prompt,
      options: this.options,
      validation: this.validation,
      metadata: this.metadata,
      response: this.response,
      respondedAt: this.respondedAt,
      status: this.status,
    };
  }

  /**
   * Create from JSON
   * @param {Object} json
   * @returns {InputRequest}
   */
  static fromJSON(json) {
    const request = new InputRequest({
      type: json.type,
      prompt: json.prompt,
      options: json.options,
      validation: json.validation,
      metadata: json.metadata,
    });

    request.id = json.id;
    request.response = json.response;
    request.respondedAt = json.respondedAt;
    request.status = json.status;

    return request;
  }
}
