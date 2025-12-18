/**
 * @fileoverview BaseAIProvider - Abstract AI provider interface
 * Defines the contract for AI providers that power task planning and intelligent automation.
 */

/**
 * Task plan structure
 * @typedef {Object} TaskPlan
 * @property {Array<Object>} steps - Array of automation steps
 * @property {Object} metadata - Plan metadata
 * @property {number} confidence - Confidence score (0-1)
 */

/**
 * Selector suggestion result
 * @typedef {Object} SelectorSuggestion  
 * @property {Array<string>} selectors - Suggested CSS selectors
 * @property {number} confidence - Confidence score (0-1)
 * @property {string} reasoning - Explanation of suggestions
 */

/**
 * Recovery suggestion
 * @typedef {Object} RecoverySuggestion
 * @property {string} action - Suggested action (retry, fallback, modify, abort)
 * @property {Object} parameters - Modified parameters
 * @property {string} reason - Explanation
 */

/**
 * BaseAIProvider abstract class
 * All AI providers must extend this class
 * @abstract
 */
class BaseAIProvider {
  /**
   * @param {string} name - Provider name
   * @param {Object} [config] - Provider configuration
   */
  constructor(name, config = {}) {
    if (new.target === BaseAIProvider) {
      throw new Error('BaseAIProvider is abstract and cannot be instantiated directly');
    }

    this.name = name;
    this.config = config;
    this.stats = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      totalTokens: 0,
    };
  }

  /**
   * Generates a task plan from a user goal
   * @abstract
   * @param {string} goal - Natural language goal
   * @param {Object} [context] - Additional context
   * @returns {Promise<TaskPlan>} Generated task plan
   */
  async generatePlan(_goal, _context = {}) {
    throw new Error('generatePlan() must be implemented by child class');
  }

  /**
   * Suggests CSS selectors for extracting data
   * @abstract
   * @param {string} html - HTML content
   * @param {string} intent - What to extract
   * @param {Object} [context] - Additional context
   * @returns {Promise<SelectorSuggestion>}  Suggested selectors
   */
  async suggestSelectors(_html, _intent, _context = {}) {
    throw  new Error('suggestSelectors() must be implemented by child class');
  }

  /**
   * Suggests recovery actions for errors
   * @abstract
   * @param {Error|Object} error - Error that occurred
   * @param {Object} context - Execution context
   * @returns {Promise<RecoverySuggestion>} Recovery suggestion
   */
  async recoverFromError(_error, _context = {}) {
    throw new Error('recoverFromError() must be implemented by child class');
  }

  /**
   * Decides next action based on current state (Phase 5)
   * @abstract
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Decision object
   */
  async decideNextAction(_context) {
    throw new Error('decideNextAction() must be implemented by child class');
  }

  /**
   * Analyzes if goal is achieved (Phase 5)
   * @abstract
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Goal completion analysis
   */
  async analyzeGoalCompletion(_context) {
    throw new Error('analyzeGoalCompletion() must be implemented by child class');
  }

  /**
   * Gets provider name
   * @returns {string} Provider name
   */
  getName() {
    return this.name;
  }

  /**
   * Gets provider statistics
   * @returns {Object} Usage statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Resets provider statistics
   */
  resetStats() {
    this.stats = {
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      totalTokens: 0,
    };
  }

  /**
   * Increments request count
   * @protected
   */
  _incrementRequests() {
    this.stats.requestCount += 1;
  }

  /**
   * Records successful request
   * @param {number} [tokens=0] - Tokens used
   * @protected
   */
  _recordSuccess(tokens = 0) {
    this.stats.successCount += 1;
    this.stats.totalTokens += tokens;
  }

  /**
   * Records failed request
   * @protected
   */
  _recordFailure() {
    this.stats.failureCount += 1;
  }

  /**
   * Gets configuration value
   * @param {string} key - Config key
   * @param {*} [defaultValue] - Default value
   * @returns {*} Configuration value
   * @protected
   */
  _getConfig(key, defaultValue = null) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  /**
   * Track request execution
   * @param {boolean} success - Whether request succeeded
   * @param {number} [durationMs=0] - Request duration
   * @protected
   */
  _trackRequest(success, durationMs = 0) {
    this.stats.requestCount += 1;
    if (success) {
      this.stats.successCount += 1;
    } else {
      this.stats.failureCount += 1;
    }
  }

  /**
   * Track token usage
   * @param {number} inputTokens - Input tokens
   * @param {number} outputTokens - Output tokens
   * @protected
   */
  _trackTokens(inputTokens, outputTokens) {
    this.stats.totalTokens += (inputTokens || 0) + (outputTokens || 0);
  }
}

export default BaseAIProvider;
