/**
 * @fileoverview ActionExecutor - Executes individual automation actions
 * Handles action validation, execution, and result transformation.
 */

import { ExecutionResult, ErrorCategory } from '../models/ExecutionResult.js';
import { ProviderError, ActionNotSupportedError } from '../data/providers/BaseProvider.js';


/**
 * ActionExecutor service
 * Executes automation actions using providers
 * @class
 */
class ActionExecutor {
  /**
   * @param {Object} [config] - Executor configuration
   * @param {boolean} [config.validateBeforeExecution=true] - Validate actions before execution
   */
  constructor(config = {}) {
    this.config = {
      validateBeforeExecution: true,
      ...config,
    };
  }

  /**
   * Executes an automation action
   * @param {AutomationAction} action - Action to execute
   * @param {BaseProvider} provider - Provider to use for execution
   * @param {Object} [context] - Execution context
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeAction(action, provider, context = {}) {
    try {
      // Validate action if configured
      if (this.config.validateBeforeExecution) {
        const validationResult = this._validateAction(action);
        if (!validationResult.valid) {
          return ExecutionResult.failure({
            message: `Action validation failed: ${validationResult.errors.join(', ')}`,
            category: ErrorCategory.VALIDATION_ERROR,
          });
        }
      }

      // Check if provider can handle the action
      if (!provider.canHandle(action)) {
        return ExecutionResult.failure({
          message: `Provider ${provider.getName()} cannot handle action type ${action.type}`,
          category: ErrorCategory.PROVIDER_ERROR,
        });
      }

      // Normalize action parameters
      const normalizedAction = this._normalizeActionParameters(action);

      // Execute action
      const startTime = Date.now();
      const result = await provider.executeAction(normalizedAction, context);
      const duration = Date.now() - startTime;

      // Transform result to standard format
      const transformedResult = this._transformResult(result, {
        actionId: action.id,
        actionType: action.type,
        providerName: provider.getName(),
        duration,
      });

      return transformedResult;

    } catch (error) {
      return this._handleExecutionError(error, action, provider);
    }
  }

  /**
   * Validates an action
   * @param {AutomationAction} action - Action to validate
   * @returns {{valid: boolean, errors: Array<string>}} Validation result
   * @private
   */
  _validateAction(action) {
    if (!action) {
      return { valid: false, errors: ['Action is null or undefined'] };
    }

    if (!action.validate) {
      return { valid: false, errors: ['Action does not have validate() method'] };
    }

    return action.validate();
  }

  /**
   * Normalizes action parameters
   * @param {AutomationAction} action - Action to normalize
   * @returns {AutomationAction} Action with normalized parameters
   * @private
   */
  _normalizeActionParameters(action) {
    // For now, return action as-is
    // In future, could add parameter normalization logic here
    return action;
  }

  /**
   * Transforms execution result to standard format
   * @param {ExecutionResult|*} result - Raw execution result
   * @param {Object} metadata - Additional metadata to add
   * @returns {ExecutionResult} Transformed result
   * @private
   */
  _transformResult(result, metadata) {
    // Normalize to ExecutionResult if not already
    const normalizedResult = ExecutionResult.normalize(result);

    // Add execution metadata
    Object.entries(metadata).forEach(([key, value]) => {
      normalizedResult.addMetadata(key, value);
    });

    return normalizedResult;
  }

  /**
   * Handles execution errors
   * @param {Error} error - Error that occurred
   * @param {AutomationAction} action - Action that failed
   * @param {BaseProvider} provider - Provider that was used
   * @returns {ExecutionResult} Error result
   * @private
   */
  _handleExecutionError(error, action, provider) {
    const errorMessage = error.message || 'Unknown execution error';

    let errorCategory = ErrorCategory.UNKNOWN;


    if (error instanceof ActionNotSupportedError) {
      errorCategory = ErrorCategory.PROVIDER_ERROR;
    } else if (error instanceof ProviderError) {
      errorCategory = ErrorCategory.PROVIDER_ERROR;
    } else if (errorMessage.toLowerCase().includes('timeout')) {
      errorCategory = ErrorCategory.TIMEOUT;
    } else if (errorMessage.toLowerCase().includes('network')) {
      errorCategory = ErrorCategory.NETWORK;
    }

    return ExecutionResult.failure(error, {
      actionId: action.id,
      actionType: action.type,
      providerName: provider.getName(),
      errorCategory,
    });
  }
}

export { ActionExecutor };
