/**
 * @fileoverview BaseProvider - Abstract provider interface
 * Defines the contract that all automation providers must implement.
 * Providers execute actions using specific mediums (API, Scraper, Browser).
 */

const { ActionType } = require('../../models/AutomationAction');
const { ExecutionResult } = require('../../models/ExecutionResult');

/**
 * Custom error for provider-related failures
 * @class
 */
class ProviderError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} [providerName] - Name of the provider that failed
   * @param {*} [originalError] - Original error that caused this
   */
  constructor(message, providerName = null, originalError = null) {
    super(message);
    this.name = 'ProviderError';
    this.providerName = providerName;
    this.originalError = originalError;
  }
}

/**
 * Error for unsupported actions
 * @class
 */
class ActionNotSupportedError extends ProviderError {
  /**
   * @param {string} actionType - Type of action not supported
   * @param {string} providerName - Name of the provider
   */
  constructor(actionType, providerName) {
    super(`Action type ${actionType} is not supported by ${providerName}`, providerName);
    this.name = 'ActionNotSupportedError';
    this.actionType = actionType;
  }
}

/**
 * BaseProvider abstract class
 * All providers must extend this class and implement its methods
 * @abstract
 */
class BaseProvider {
  /**
   * @param {string} name - Provider name
   * @param {Object} [config] - Provider configuration
   */
  constructor(name, config = {}) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly');
    }

    this.name = name;
    this.config = config;
    this.capabilities = this._defineCapabilities();
    this.isHealthy = true;
    this.lastHealthCheck = null;
  }

  /**
   * Defines provider capabilities
   * Must be implemented by child classes
   * @abstract
   * @returns {Object} Capability flags
   * @protected
   */
  _defineCapabilities() {
    throw new Error('_defineCapabilities() must be implemented by child class');
  }

  /**
   * Executes an automation action
   * @abstract
   * @param {AutomationAction} action - Action to execute
   * @param {Object} [context] - Execution context
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeAction(action, _context = {}) {
    throw new Error('executeAction() must be implemented by child class');
  }

  /**
   * Checks if provider can handle a specific action
   * @param {AutomationAction} action - Action to check
   * @returns {boolean} True if provider can handle the action
   */
  canHandle(action) {
    if (!action || !action.type) {
      return false;
    }

    const actionType = action.type;
    const capabilities = this.capabilities;

    // Map action types to capability flags
    const capabilityMap = {
      [ActionType.NAVIGATE]: capabilities.supportsNavigation,
      [ActionType.SEARCH]: capabilities.supportsSearch,
      [ActionType.EXTRACT_TEXT]: capabilities.supportsExtraction,
      [ActionType.EXTRACT_ATTRIBUTE]: capabilities.supportsExtraction,
      [ActionType.CLICK]: capabilities.supportsInteraction,
      [ActionType.TYPE]: capabilities.supportsInteraction,
      [ActionType.WAIT]: true, // All providers can wait
    };

    return capabilityMap[actionType] || false;
  }

  /**
   * Performs a health check on the provider
   * @returns {Promise<{healthy: boolean, details: Object}>} Health check result
   */
  async healthCheck() {
    try {
      const details = await this._performHealthCheck();
      this.isHealthy = details.healthy;
      this.lastHealthCheck = new Date().toISOString();
      
      return {
        healthy: this.isHealthy,
        details: {
          providerName: this.name,
          timestamp: this.lastHealthCheck,
          ...details,
        },
      };
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date().toISOString();
      
      return {
        healthy: false,
        details: {
          providerName: this.name,
          timestamp: this.lastHealthCheck,
          error: error.message,
        },
      };
    }
  }

  /**
   * Provider-specific health check implementation
   * @abstract
   * @returns {Promise<{healthy: boolean, [key: string]: *}>} Health details
   * @protected
   */
  async _performHealthCheck() {
    // Default implementation - can be overridden
    return { healthy: true };
  }

  /**
   * Gets the provider name
   * @returns {string} Provider name
   */
  getName() {
    return this.name;
  }

  /**
   * Gets provider capabilities
   * @returns {Object} Capability flags
   */
  getCapabilities() {
    return { ...this.capabilities };
  }

  /**
   * Checks if provider is currently healthy
   * @returns {boolean} True if healthy
   */
  isHealthyStatus() {
    return this.isHealthy;
  }

  /**
   * Gets configuration value
   * @param {string} key - Configuration key
   * @param {*} [defaultValue] - Default value if key not found
   * @returns {*} Configuration value
   */
  getConfig(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  /**
   * Sets configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   */
  setConfig(key, value) {
    this.config[key] = value;
  }

  /**
   * Creates a provider-specific error
   * @param {string} message - Error message
   * @param {*} [originalError] - Original error
   * @returns {ProviderError} Provider error
   * @protected
   */
  _createError(message, originalError = null) {
    return new ProviderError(message, this.name, originalError);
  }

  /**
   * Creates an action not supported error
   * @param {string} actionType - Action type
   * @returns {ActionNotSupportedError} Action not supported error
   * @protected
   */
  _createActionNotSupportedError(actionType) {
    return new ActionNotSupportedError(actionType, this.name);
  }

  /**
   * Validates action before execution
   * @param {AutomationAction} action - Action to validate
   * @throws {ActionNotSupportedError} If action is not supported
   * @protected
   */
  _validateAction(action) {
    if (!this.canHandle(action)) {
      throw this._createActionNotSupportedError(action.type);
    }

    const validation = action.validate();
    if (!validation.valid) {
      throw this._createError(`Invalid action: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Wraps execution with error handling
   * @param {Function} executionFn - Function to execute
   * @returns {Promise<ExecutionResult>} Execution result
   * @protected
   */
  async _wrapExecution(executionFn) {
    try {
      const result = await executionFn();
      return ExecutionResult.normalize(result);
    } catch (error) {
      if (error instanceof ProviderError) {
        return ExecutionResult.failure(error);
      }
      
      return ExecutionResult.failure(
        this._createError('Execution failed', error)
      );
    }
  }
}

module.exports = {
  BaseProvider,
  ProviderError,
  ActionNotSupportedError,
};
