/**
 * @fileoverview StepExecutor - Executes automation steps with strategy selection
 * Orchestrates action execution with provider strategy selection and fallback.
 */

import { ExecutionResult } from '../models/ExecutionResult.js';
import { StrategySelector } from './StrategySelector.js';
import { ActionExecutor } from './ActionExecutor.js';

/**
 * StepExecutor service
 * Executes automation steps with intelligent strategy selection
 * @class
 */
class StepExecutor {
  /**
   * @param {Object} [config] - Executor configuration
   * @param {StrategySelector} [config.strategySelector] - Strategy selector instance
   * @param {ActionExecutor} [config.actionExecutor] - Action executor instance
   * @param {number} [config.maxRetries=2] - Maximum retry attempts per strategy
   * @param {number} [config.retryDelay=1000] - Delay between retries in ms
   */
  constructor(config = {}) {
    this.strategySelector = config.strategySelector || new StrategySelector();
    this.actionExecutor = config.actionExecutor || new ActionExecutor();
    this.maxRetries = config.maxRetries ?? 2;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  /**
   * Executes an automation step
   * @param {AutomationStep} step - Step to execute
   * @param {Object} [context] - Execution context
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeStep(step, context = {}) {
    try {
      // Validate step
      const validation = step.validate();
      if (!validation.valid) {
        return this._failStep(step, {
          message: `Step validation failed: ${validation.errors.join(', ')}`,
        });
      }

      // Mark step as running
      step.markAsRunning();

      // Select strategy
      const selection = this.strategySelector.selectStrategy(step.action, context);
      
      if (!selection) {
        return this._failStep(step, {
          message: 'No suitable provider strategy available',
        });
      }

      // Execute with retry and fallback
      const result = await this._executeWithRetryAndFallback(
        step,
        selection.strategy,
        selection.provider,
        context
      );

      // Validate result against expected output
      if (result.success && Object.keys(step.expectedOutput).length > 0) {
        const resultValidation = step.validateResult(result.data);
        if (!resultValidation.valid) {
          result.addMetadata('validationWarnings', resultValidation.errors);
        }
      }

      // Check failure conditions
      if (result.success) {
        const failureCheck = step.checkFailureConditions(result.data);
        if (failureCheck.failed) {
          return this._failStep(step, {
            message: `Failure conditions met: ${failureCheck.reasons.join(', ')}`,
            data: result.data,
          });
        }
      }

      // Mark step based on result
      if (result.success) {
        step.markAsSuccess(result.data);
        step.setProviderUsed(result.getMetadata('providerName'));
      } else {
        step.markAsFailed(result.error);
      }

      return result;

    } catch (error) {
      return this._failStep(step, error);
    }
  }

  /**
   * Executes with retry and fallback mechanisms
   * @param {AutomationStep} step - Step being executed
   * @param {string} strategyType - Current strategy type
   * @param {BaseProvider} provider - Current provider
   * @param {Object} context - Execution context
   * @param {number} [retryCount=0] - Current retry count
   * @returns {Promise<ExecutionResult>} Execution result
   * @private
   */
  async _executeWithRetryAndFallback(step, strategyType, provider, context, retryCount = 0) {
    try {
      // Execute action
      const result = await this.actionExecutor.executeAction(
        step.action,
        provider,
        { ...context, stepId: step.id }
      );

      // If successful, return result
      if (result.success) {
        return result;
      }

      // If failed, check if we should retry
      if (result.isRetryable() && retryCount < this.maxRetries) {
        // Wait before retry
        await this._delay(this.retryDelay);
        
        // Retry with same provider
        step.incrementRetryCount();
        return this._executeWithRetryAndFallback(
          step,
          strategyType,
          provider,
          context,
          retryCount + 1
        );
      }

      // If retries exhausted, try fallback strategy
      const fallback = this.strategySelector.getFallbackStrategy(
        strategyType,
        result.error,
        context
      );

      if (fallback) {
        // Reset retry count for new strategy
        return this._executeWithRetryAndFallback(
          step,
          fallback.strategy,
          fallback.provider,
          context,
          0
        );
      }

      // No fallback available, return failure
      return result;

    } catch (error) {
      // Unexpected error during execution
      return ExecutionResult.failure(error);
    }
  }

  /**
   * Marks step as failed and returns failure result
   * @param {AutomationStep} step - Step that failed
   * @param {Error|Object|string} error - Error information
   * @returns {ExecutionResult} Failure result
   * @private
   */
  _failStep(step, error) {
    step.markAsFailed(error);
    return ExecutionResult.failure(error, {
      stepId: step.id,
      stepDescription: step.description,
    });
  }

  /**
   * Delays execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets execution statistics for a step
   * @param {AutomationStep} step - Step to get stats for
   * @returns {Object} Execution statistics
   */
  getStepStats(step) {
    return {
      stepId: step.id,
      status: step.status,
      retryCount: step.executionMetadata.retryCount,
      providerUsed: step.executionMetadata.providerUsed,
      duration: step.executionMetadata.duration,
      startedAt: step.executionMetadata.startedAt,
      completedAt: step.executionMetadata.completedAt,
    };
  }
}

export { StepExecutor };
