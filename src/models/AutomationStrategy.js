/**
 * @fileoverview AutomationStrategy Model
 * Defines how automation steps are executed through different provider strategies.
 * Strategy selection follows the order: API → Scraper → Browser (most efficient to most comprehensive).
 */

/**
 * Strategy type enumeration
 * @enum {string}
 * @readonly
 */
const StrategyType = Object.freeze({
  API: 'API',
  SCRAPER: 'SCRAPER',
  BROWSER: 'BROWSER',
});

/**
 * Default strategy priority order (highest to lowest priority)
 * API is preferred (fastest, most reliable)
 * SCRAPER is fallback (medium speed, good reliability)
 * BROWSER is last resort (slowest, most comprehensive)
 * @type {Array<string>}
 */
const DEFAULT_STRATEGY_PRIORITY = [
  StrategyType.API,
  StrategyType.SCRAPER,
  StrategyType.BROWSER,
];

/**
 * Strategy capability requirements
 * Defines what each strategy type can handle
 * @type {Object.<string, Object>}
 */
const StrategyCapabilities = {
  [StrategyType.API]: {
    requiresJavaScript: false,
    supportsNavigation: true,
    supportsSearch: true,
    supportsExtraction: true,
    supportsInteraction: false,
    supportsPagination: true,
    supportsFileUpload: false,
    speed: 'fast',
    reliability: 'high',
  },
  [StrategyType.SCRAPER]: {
    requiresJavaScript: false,
    supportsNavigation: true,
    supportsSearch: true,
    supportsExtraction: true,
    supportsInteraction: false,
    supportsPagination: true,
    supportsFileUpload: false,
    speed: 'medium',
    reliability: 'medium',
  },
  [StrategyType.BROWSER]: {
    requiresJavaScript: true,
    supportsNavigation: true,
    supportsSearch: true,
    supportsExtraction: true,
    supportsInteraction: true,
    supportsPagination: true,
    supportsFileUpload: true,
    speed: 'slow',
    reliability: 'high',
  },
};

/**
 * Selection criteria for choosing a strategy
 * @typedef {Object} StrategySelectionCriteria
 * @property {boolean} [requiresJavaScript] - Whether JavaScript execution is needed
 * @property {boolean} [requiresInteraction] - Whether user interaction (clicks, typing) is needed
 * @property {boolean} [requiresFileUpload] - Whether file upload is needed
 * @property {string} [preferredSpeed] - Preferred execution speed ('fast', 'medium', 'slow')
 * @property {Array<string>} [excludeStrategies] - Strategy types to exclude
 * @property {Array<string>} [forceStrategies] - Strategy types to force (overrides priority)
 */

/**
 * Fallback rules for strategy execution
 * @typedef {Object} FallbackRules
 * @property {boolean} enabled - Whether fallback is enabled
 * @property {number} maxRetries - Maximum retries per strategy
 * @property {Array<string>} retryableErrorTypes - Error types that trigger fallback
 * @property {number} retryDelay - Delay between retries in milliseconds
 */

/**
 * AutomationStrategy class
 * @class
 */
class AutomationStrategy {
  /**
   * @param {Object} config - Strategy configuration
   * @param {string} config.type - Strategy type (must be from StrategyType enum)
   * @param {number} [config.priority] - Priority level (lower = higher priority)
   * @param {Object} [config.capabilities] - Strategy capabilities (defaults to standard capabilities)
   * @param {FallbackRules} [config.fallbackRules] - Fallback configuration
   * @throws {Error} If strategy type is invalid
   */
  constructor({
    type,
    priority = DEFAULT_STRATEGY_PRIORITY.indexOf(type),
    capabilities = null,
    fallbackRules = null,
  }) {
    if (!type || !Object.values(StrategyType).includes(type)) {
      throw new Error(`Invalid strategy type: ${type}. Must be one of: ${Object.values(StrategyType).join(', ')}`);
    }

    this.type = type;
    this.priority = priority;
    this.capabilities = capabilities || StrategyCapabilities[type];
    this.fallbackRules = fallbackRules || this._getDefaultFallbackRules();
  }

  /**
   * Checks if this strategy can handle the given criteria
   * @param {StrategySelectionCriteria} criteria - Selection criteria
   * @returns {boolean} True if strategy can handle the criteria
   */
  canHandle(criteria) {
    // Check if strategy is excluded
    if (criteria.excludeStrategies?.includes(this.type)) {
      return false;
    }

    // Check JavaScript requirement
    if (criteria.requiresJavaScript && !this.capabilities.requiresJavaScript) {
      return false;
    }

    // Check interaction requirement
    if (criteria.requiresInteraction && !this.capabilities.supportsInteraction) {
      return false;
    }

    // Check file upload requirement
    if (criteria.requiresFileUpload && !this.capabilities.supportsFileUpload) {
      return false;
    }

    // Check speed preference
    if (criteria.preferredSpeed && this.capabilities.speed !== criteria.preferredSpeed) {
      // This is a soft requirement, don't exclude based on speed alone
      // Just use it for sorting
    }

    return true;
  }

  /**
   * Gets the next fallback strategy type
   * @returns {string|null} Next strategy type or null if no fallback available
   */
  getNextFallbackStrategy() {
    const currentIndex = DEFAULT_STRATEGY_PRIORITY.indexOf(this.type);
    if (currentIndex === -1 || currentIndex === DEFAULT_STRATEGY_PRIORITY.length - 1) {
      return null;
    }
    return DEFAULT_STRATEGY_PRIORITY[currentIndex + 1];
  }

  /**
   * Gets default fallback rules
   * @returns {FallbackRules} Default fallback rules
   * @private
   */
  _getDefaultFallbackRules() {
    return {
      enabled: true,
      maxRetries: 2,
      retryableErrorTypes: ['NETWORK_ERROR', 'TIMEOUT', 'SELECTOR_NOT_FOUND', 'PROVIDER_ERROR'],
      retryDelay: 1000,
    };
  }

  /**
   * Serializes the strategy to a plain object
   * @returns {Object} Serialized strategy
   */
  toJSON() {
    return {
      type: this.type,
      priority: this.priority,
      capabilities: this.capabilities,
      fallbackRules: this.fallbackRules,
    };
  }

  /**
   * Creates an AutomationStrategy from a plain object
   * @param {Object} json - Serialized strategy
   * @returns {AutomationStrategy} Deserialized strategy
   */
  static fromJSON(json) {
    return new AutomationStrategy(json);
  }

  /**
   * Selects the best strategy from available strategies based on criteria
   * @param {Array<AutomationStrategy>} strategies - Available strategies
   * @param {StrategySelectionCriteria} criteria - Selection criteria
   * @returns {AutomationStrategy|null} Best matching strategy or null
   */
  static selectBestStrategy(strategies, criteria) {
    // If forced strategies are specified, use only those
    if (criteria.forceStrategies?.length > 0) {
      const forced = strategies.filter(s => criteria.forceStrategies.includes(s.type));
      if (forced.length > 0) {
        return forced.sort((a, b) => a.priority - b.priority)[0];
      }
    }

    // Filter strategies that can handle the criteria
    const capable = strategies.filter(s => s.canHandle(criteria));

    if (capable.length === 0) {
      return null;
    }

    // Sort by priority (lower number = higher priority)
    capable.sort((a, b) => a.priority - b.priority);

    return capable[0];
  }

  /**
   * Gets all available strategy types in priority order
   * @returns {Array<string>} Strategy types in priority order
   */
  static getDefaultPriorityOrder() {
    return [...DEFAULT_STRATEGY_PRIORITY];
  }

  /**
   * Creates a strategy with custom priority order
   * @param {string} type - Strategy type
   * @param {number} customPriority - Custom priority value
   * @returns {AutomationStrategy} Strategy with custom priority
   */
  static withCustomPriority(type, customPriority) {
    return new AutomationStrategy({
      type,
      priority: customPriority,
    });
  }
}

module.exports = {
  AutomationStrategy,
  StrategyType,
  StrategyCapabilities,
  DEFAULT_STRATEGY_PRIORITY,
};
