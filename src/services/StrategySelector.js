/**
 * @fileoverview StrategySelector - Provider strategy selection logic
 * Selects optimal provider based on action requirements and provider capabilities.
 */

const { AutomationStrategy, DEFAULT_STRATEGY_PRIORITY } = require('../models/AutomationStrategy');
const { ProviderRegistry } = require('../data/providers/ProviderRegistry');

/**
 * StrategySelector service
 * Selects the best provider strategy for executing actions
 * @class
 */
class StrategySelector {
  /**
   * @param {ProviderRegistry} [providerRegistry] - Provider registry instance
   */
  constructor(providerRegistry = null) {
    this.providerRegistry = providerRegistry || ProviderRegistry.getInstance();
  }

  /**
   * Selects the best strategy for an action
   * @param {AutomationAction} action - Action to execute
   * @param {Object} [context] - Execution context
   * @param {Object} [context.criteria] - Selection criteria overrides
   * @param {Array<string>} [context.excludeStrategies] - Strategies to exclude
   * @param {string} [context.forceStrategy] - Force specific strategy
   * @returns {{strategy: string, provider: BaseProvider}|null} Selected strategy and provider
   */
  selectStrategy(action, context = {}) {
    // Check for forced strategy
    if (context.forceStrategy) {
      return this._selectForcedStrategy(context.forceStrategy);
    }

    // Build selection criteria from action and context
    const criteria = this._buildCriteria(action, context);

    // Get available strategies in priority order
    const strategies = this._getAvailableStrategies(criteria);

    if (strategies.length === 0) {
      return null;
    }

    // Select first available strategy (highest priority)
    const selectedStrategy = strategies[0];
    const provider = this.providerRegistry.getProvider(selectedStrategy.type);

    if (!provider) {
      return null;
    }

    return {
      strategy: selectedStrategy.type,
      provider,
    };
  }

  /**
   * Gets fallback strategy for a failed execution
   * @param {string} currentStrategy - Current strategy that failed
   * @param {Object} error - Error that occurred
   * @param {Object} [context] - Execution context
   * @returns {{strategy: string, provider: BaseProvider}|null} Fallback strategy or null
   */
  getFallbackStrategy(currentStrategy, error, context = {}) {
    const currentStrategyObj = new AutomationStrategy({ type: currentStrategy });
    const nextStrategyType = currentStrategyObj.getNextFallbackStrategy();

    if (!nextStrategyType) {
      return null;
    }

    // Check if error is retryable
    if (!this._isRetryableError(error)) {
      return null;
    }

    const provider = this.providerRegistry.getProvider(nextStrategyType);
    
    if (!provider || !provider.isHealthyStatus()) {
      // Try next fallback
      return this.getFallbackStrategy(nextStrategyType, error, context);
    }

    return {
      strategy: nextStrategyType,
      provider,
    };
  }

  /**
   * Builds selection criteria from action and context
   * @param {AutomationAction} action - Action to execute
   * @param {Object} context - Execution context
   * @returns {Object} Selection criteria
   * @private
   */
  _buildCriteria(action, context) {
    const baseCriteria = {
      requiresJavaScript: false,
      requiresInteraction: false,
      preferredSpeed: 'fast',
    };

    // Override based on action type
    const { ActionType } = require('../models/AutomationAction');
    
    if (action.type === ActionType.CLICK || action.type === ActionType.TYPE) {
      baseCriteria.requiresInteraction = true;
    }

    // Merge with context criteria
    return {
      ...baseCriteria,
      ...context.criteria,
      excludeStrategies: context.excludeStrategies || [],
    };
  }

  /**
   * Gets available strategies that match criteria
   * @param {Object} criteria - Selection criteria
   * @returns {Array<AutomationStrategy>} Available strategies
   * @private
   */
  _getAvailableStrategies(criteria) {
    const strategies = [];

    // Create strategies in priority order
    for (const strategyType of DEFAULT_STRATEGY_PRIORITY) {
      // Skip excluded strategies
      if (criteria.excludeStrategies.includes(strategyType)) {
        continue;
      }

      const strategy = new AutomationStrategy({ type: strategyType });
      
      // Check if provider is registered and healthy
      const provider = this.providerRegistry.getProvider(strategyType);
      if (!provider || !provider.isHealthyStatus()) {
        continue;
      }

      // Check if strategy can handle criteria
      if (strategy.canHandle(criteria)) {
        strategies.push(strategy);
      }
    }

    return strategies;
  }

  /**
   * Selects forced strategy
   * @param {string} strategyType - Strategy type to force
   * @returns {{strategy: string, provider: BaseProvider}|null} Forced strategy or null
   * @private
   */
  _selectForcedStrategy(strategyType) {
    const provider = this.providerRegistry.getProvider(strategyType);
    
    if (!provider) {
      return null;
    }

    return {
      strategy: strategyType,
      provider,
    };
  }

  /**
   * Checks if error is retryable with different strategy
   * @param {Object} error - Error object
   * @returns {boolean} True if retryable
   * @private
   */
  _isRetryableError(error) {
    const { ErrorCategory } = require('../models/ExecutionResult');
    
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.PROVIDER_ERROR,
      ErrorCategory.SELECTOR_NOT_FOUND,
    ];

    // Check if error has category
    if (error.errorCategory) {
      return retryableCategories.includes(error.errorCategory);
    }

    // Check error message for retryable patterns
    const errorMessage = (error.message || '').toLowerCase();
    return retryableCategories.some(category => 
      errorMessage.includes(category.toLowerCase())
    );
  }

  /**
   * Gets all available providers with their strategies
   * @returns {Array<{strategy: string, provider: BaseProvider}>} Available providers
   */
  getAllAvailableProviders() {
    const available = [];

    for (const strategyType of DEFAULT_STRATEGY_PRIORITY) {
      const provider = this.providerRegistry.getProvider(strategyType);
      
      if (provider && provider.isHealthyStatus()) {
        available.push({
          strategy: strategyType,
          provider,
        });
      }
    }

    return available;
  }
}

module.exports = { StrategySelector };
