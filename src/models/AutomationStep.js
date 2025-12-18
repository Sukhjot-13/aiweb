/**
 * @fileoverview AutomationStep Model
 * Wraps an AutomationAction with execution context, expected outputs, and failure conditions.
 * A step represents a single unit of work with a clear intent.
 */

const { AutomationAction } = require('./AutomationAction');

/**
 * Step status enumeration
 * @enum {string}
 * @readonly
 */
const StepStatus = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
});

/**
 * Represents an automation step with context and validation
 * @class
 */
class AutomationStep {
  /**
   * @param {Object} config - Step configuration
   * @param {AutomationAction} config.action - The action to execute
   * @param {string} [config.id] - Unique step identifier
   * @param {string} [config.description] - Human-readable description of step intent
   * @param {Object} [config.expectedOutput] - Schema defining expected output structure
   * @param {Array<Object>} [config.failureConditions] - Conditions that indicate step failure
   * @param {Object} [config.context] - Additional context (previous results, environment vars)
   * @param {Object} [config.metadata] - Additional metadata
   * @throws {Error} If step configuration is invalid
   */
  constructor({
    action,
    id,
    description = '',
    expectedOutput = {},
    failureConditions = [],
    context = {},
    metadata = {},
  }) {
    if (!action || !(action instanceof AutomationAction)) {
      throw new Error('Step must have a valid AutomationAction');
    }

    this.id = id || `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.action = action;
    this.description = description;
    this.expectedOutput = expectedOutput;
    this.failureConditions = failureConditions;
    this.context = context;
    this.status = StepStatus.PENDING;
    this.result = null;
    this.error = null;
    this.metadata = {
      createdAt: new Date().toISOString(),
      ...metadata,
    };
    this.executionMetadata = {
      startedAt: null,
      completedAt: null,
      duration: null,
      retryCount: 0,
      providerUsed: null,
    };
  }

  /**
   * Validates the step configuration
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  validate() {
    const errors = [];

    // Validate action
    const actionValidation = this.action.validate();
    if (!actionValidation.valid) {
      errors.push(...actionValidation.errors.map(err => `Action validation failed: ${err}`));
    }

    // Validate expectedOutput structure if provided
    if (this.expectedOutput && typeof this.expectedOutput !== 'object') {
      errors.push('expectedOutput must be an object');
    }

    // Validate failureConditions structure
    if (!Array.isArray(this.failureConditions)) {
      errors.push('failureConditions must be an array');
    } else {
      this.failureConditions.forEach((condition, index) => {
        if (!condition.field || !condition.operator) {
          errors.push(`failureConditions[${index}] must have 'field' and 'operator' properties`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Marks the step as running
   */
  markAsRunning() {
    this.status = StepStatus.RUNNING;
    this.executionMetadata.startedAt = new Date().toISOString();
  }

  /**
   * Marks the step as successful with result
   * @param {Object} result - Execution result
   */
  markAsSuccess(result) {
    this.status = StepStatus.SUCCESS;
    this.result = result;
    this.executionMetadata.completedAt = new Date().toISOString();
    this._calculateDuration();
  }

  /**
   * Marks the step as failed with error
   * @param {Error|Object} error - Error object or message
   */
  markAsFailed(error) {
    this.status = StepStatus.FAILED;
    this.error = error instanceof Error ? error.message : error;
    this.executionMetadata.completedAt = new Date().toISOString();
    this._calculateDuration();
  }

  /**
   * Marks the step as skipped
   * @param {string} [reason] - Reason for skipping
   */
  markAsSkipped(reason = '') {
    this.status = StepStatus.SKIPPED;
    this.metadata.skipReason = reason;
    this.executionMetadata.completedAt = new Date().toISOString();
  }

  /**
   * Increments the retry count
   */
  incrementRetryCount() {
    this.executionMetadata.retryCount += 1;
  }

  /**
   * Sets the provider that was used for execution
   * @param {string} providerName - Name of the provider
   */
  setProviderUsed(providerName) {
    this.executionMetadata.providerUsed = providerName;
  }

  /**
   * Checks if any failure conditions are met
   * @param {Object} result - Execution result to check
   * @returns {{failed: boolean, reasons: string[]}} Failure check result
   */
  checkFailureConditions(result) {
    const reasons = [];

    for (const condition of this.failureConditions) {
      const { field, operator, value } = condition;
      const actualValue = this._getNestedValue(result, field);

      let conditionMet = false;
      switch (operator) {
        case 'equals':
          conditionMet = actualValue === value;
          break;
        case 'notEquals':
          conditionMet = actualValue !== value;
          break;
        case 'contains':
          conditionMet = actualValue && actualValue.includes(value);
          break;
        case 'exists':
          conditionMet = actualValue !== undefined && actualValue !== null;
          break;
        case 'notExists':
          conditionMet = actualValue === undefined || actualValue === null;
          break;
        case 'greaterThan':
          conditionMet = actualValue > value;
          break;
        case 'lessThan':
          conditionMet = actualValue < value;
          break;
        default:
          reasons.push(`Unknown operator: ${operator}`);
      }

      if (conditionMet) {
        reasons.push(`Failure condition met: ${field} ${operator} ${value}`);
      }
    }

    return {
      failed: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Validates result against expected output schema
   * @param {Object} result - Execution result
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  validateResult(result) {
    const errors = [];

    if (!this.expectedOutput || Object.keys(this.expectedOutput).length === 0) {
      return { valid: true, errors: [] };
    }

    for (const [field, expectedType] of Object.entries(this.expectedOutput)) {
      const actualValue = this._getNestedValue(result, field);
      
      if (actualValue === undefined || actualValue === null) {
        errors.push(`Expected field '${field}' is missing in result`);
        continue;
      }

      const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;
      if (actualType !== expectedType && !Array.isArray(expectedType)) {
        errors.push(`Field '${field}' expected type ${expectedType}, got ${actualType}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculates execution duration
   * @private
   */
  _calculateDuration() {
    if (this.executionMetadata.startedAt && this.executionMetadata.completedAt) {
      const start = new Date(this.executionMetadata.startedAt);
      const end = new Date(this.executionMetadata.completedAt);
      this.executionMetadata.duration = end - start;
    }
  }

  /**
   * Gets nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notated path (e.g., 'data.results.0.title')
   * @returns {*} Value at path or undefined
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Serializes the step to a plain object
   * @returns {Object} Serialized step
   */
  toJSON() {
    return {
      id: this.id,
      action: this.action.toJSON(),
      description: this.description,
      expectedOutput: this.expectedOutput,
      failureConditions: this.failureConditions,
      context: this.context,
      status: this.status,
      result: this.result,
      error: this.error,
      metadata: this.metadata,
      executionMetadata: this.executionMetadata,
    };
  }

  /**
   * Creates an AutomationStep from a plain object
   * @param {Object} json - Serialized step
   * @returns {AutomationStep} Deserialized step
   */
  static fromJSON(json) {
    const action = AutomationAction.fromJSON(json.action);
    const step = new AutomationStep({
      action,
      id: json.id,
      description: json.description,
      expectedOutput: json.expectedOutput,
      failureConditions: json.failureConditions,
      context: json.context,
      metadata: json.metadata,
    });

    step.status = json.status;
    step.result = json.result;
    step.error = json.error;
    step.executionMetadata = json.executionMetadata;

    return step;
  }
}

module.exports = {
  AutomationStep,
  StepStatus,
};
