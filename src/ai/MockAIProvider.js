/**
 * @fileoverview MockAIProvider - Mock AI provider for testing/development
 * Provides predefined plans for common automation goals without requiring API keys.
 */

import BaseAIProvider from './BaseAIProvider.js';
import { AutomationAction } from '../models/AutomationAction.js';


/**
 * MockAIProvider class
 * Mock AI implementation with predefined plans
 * @class
 * @extends BaseAIProvider
 */
class MockAIProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('MockAIProvider', config);
    this.planTemplates = this._initializePlanTemplates();
  }

  /**
   * Generates a task plan from a user goal
   * @param {string} goal - Natural language goal
   * @param {Object} [context] - Additional context
   * @returns {Promise<Object>} Generated task plan
   */
  async generatePlan(goal, _context = {}) {
    this._incrementRequests();

    try {
      // Simulate AI processing delay
      await this._simulateDelay(100);

      // Find matching template
      const template = this._findMatchingTemplate(goal);

      if (!template) {
        this._recordFailure();
        throw new Error(`No template found for goal: ${goal}`);
      }

      // Generate plan from template
      const plan = this._generateFromTemplate(template, goal);

      this._recordSuccess();
      return plan;
    } catch (error) {
      this._recordFailure();
      throw error;
    }
  }

  /**
   * Suggests CSS selectors for extracting data
   * @param {string} _html - HTML content (unused in mock)
   * @param {string} intent - What to extract
   * @param {Object} [_context] - Additional context
   * @returns {Promise<Object>} Suggested selectors
   */
  async suggestSelectors(_html, intent, _context = {}) {
    this._incrementRequests();

    try {
      await this._simulateDelay(50);

      const suggestions = this._getSelectorSuggestions(intent);

      this._recordSuccess();
      return suggestions;
    } catch (error) {
      this._recordFailure();
      throw error;
    }
  }

  /**
   * Suggests recovery actions for errors
   * @param {Error|Object} error - Error that occurred
   * @param {Object} _context - Execution context
   * @returns {Promise<Object>} Recovery suggestion
   */
  async recoverFromError(error, _context = {}) {
    this._incrementRequests();

    try {
      await this._simulateDelay(50);

      const errorMessage = error.message || String(error);
      const recovery = this._getRecoverySuggestion(errorMessage);

      this._recordSuccess();
      return recovery;
    } catch (err) {
      this._recordFailure();
      throw err;
    }
  }

  /**
   * Initializes plan templates
   * @returns {Map} Plan templates
   * @private
   */
  _initializePlanTemplates() {
    const templates = new Map();

    // Price comparison template
    templates.set('price-comparison', {
      keywords: ['price', 'cheapest', 'compare', 'find', 'buy', 'cost'],
      planGenerator: (goal) => ({
        goal,
        steps: [
          {
            action: AutomationAction.wait({ duration: 10 }),
            description: 'Initialize price comparison',
          },
          {
            action: AutomationAction.search(this._extractProductName(goal), { maxResults: 10 }),
            description: 'Search for product across marketplaces',
          },
          {
            action: AutomationAction.extractText('.product-price', { multiple: true }),
            description: 'Extract product prices',
          },
        ],
        metadata: {
          templateUsed: 'price-comparison',
          aiGenerated: false,
        },
        confidence: 0.9,
      }),
    });

    // Data extraction template
    templates.set('data-extraction', {
      keywords: ['extract', 'scrape', 'get', 'fetch', 'collect', 'data'],
      planGenerator: (goal) => ({
        goal,
        steps: [
          {
            action: AutomationAction.navigate(this._extractUrl(goal) || 'https://example.com'),
            description: 'Navigate to target page',
          },
          {
            action: AutomationAction.extractText('body', { multiple: false }),
            description: 'Extract page content',
          },
        ],
        metadata: {
          templateUsed: 'data-extraction',
          aiGenerated: false,
        },
        confidence: 0.85,
      }),
    });

    // Search template
    templates.set('search', {
      keywords: ['search', 'lookup', 'query', 'find information'],
      planGenerator: (goal) => ({
        goal,
        steps: [
          {
            action: AutomationAction.search(this._extractSearchQuery(goal), { maxResults: 10 }),
            description: 'Execute search query',
          },
          {
            action: AutomationAction.extractText('.search-result', { multiple: true }),
            description: 'Extract search results',
          },
        ],
        metadata: {
          templateUsed: 'search',
          aiGenerated: false,
        },
        confidence: 0.88,
      }),
    });

    return templates;
  }

  /**
   * Finds matching template for goal
   * @param {string} goal - User goal
   * @returns {Object|null} Matching template
   * @private
   */
  _findMatchingTemplate(goal) {
    const goalLower = goal.toLowerCase();

    for (const [_name, template] of this.planTemplates) {
      const matches = template.keywords.some(keyword => 
        goalLower.includes(keyword.toLowerCase())
      );

      if (matches) {
        return template;
      }
    }

    // Default to price-comparison if no match
    return this.planTemplates.get('price-comparison');
  }

  /**
   * Generates plan from template
   * @param {Object} template - Plan template
   * @param {string} goal - User goal
   * @returns {Object} Generated plan
   * @private
   */
  _generateFromTemplate(template, goal) {
    return template.planGenerator(goal);
  }

  /**
   * Extracts product name from goal
   * @param {string} goal - User goal
   * @returns {string} Product name
   * @private
   */
  _extractProductName(goal) {
    // Simple extraction: remove common words
    const commonWords = ['find', 'cheapest', 'price', 'for', 'the', 'a', 'an', 'best', 'compare'];
    const words = goal.toLowerCase().split(' ').filter(w => !commonWords.includes(w));
    return words.join(' ') || 'product';
  }

  /**
   * Extracts URL from goal
   * @param {string} goal - User goal
   * @returns {string|null} Extracted URL
   * @private
   */
  _extractUrl(goal) {
    const urlMatch = goal.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  /**
   * Extracts search query from goal
   * @param {string} goal - User goal
   * @returns {string} Search query
   * @private
   */
  _extractSearchQuery(goal) {
    const queryMatch = goal.match(/(?:search|find|lookup)\s+(?:for\s+)?(.+)/i);
    return queryMatch ? queryMatch[1] : goal;
  }

  /**
   * Gets selector suggestions for intent
   * @param {string} intent - Extraction intent
   * @returns {Object} Selector suggestions
   * @private
   */
  _getSelectorSuggestions(intent) {
    const intentLower = intent.toLowerCase();

    const selectorMap = {
      price: ['.price', '.product-price', '[data-price]', '.cost'],
      title: ['h1', '.title', '.product-name', '.heading'],
      description: ['.description', '.product-description', 'p'],
      link: ['a', '.link', '[href]'],
      image: ['img', '.image', '[src]'],
    };

    for (const [key, selectors] of Object.entries(selectorMap)) {
      if (intentLower.includes(key)) {
       return {
          selectors,
          confidence: 0.85,
          reasoning: `Commonly used selectors for ${key} extraction`,
        };
      }
    }

    // Default selectors
    return {
      selectors: ['.content', 'main', 'body'],
      confidence: 0.5,
      reasoning: 'Generic fallback selectors',
    };
  }

  /**
   * Gets recovery suggestion for error
   * @param {string} errorMessage - Error message
   * @returns {Object} Recovery suggestion
   * @private
   */
  _getRecoverySuggestion(errorMessage) {
    const errorLower = errorMessage.toLowerCase();

    if (errorLower.includes('timeout')) {
      return {
        action: 'retry',
        parameters: { timeout: 60000 },
        reason: 'Increase timeout and retry',
      };
    }

    if (errorLower.includes('selector') || errorLower.includes('not found')) {
      return {
        action: 'modify',
        parameters: { selector: 'body' },
        reason: 'Try broader selector',
      };
    }

    if (errorLower.includes('network')) {
      return {
        action: 'fallback',
        parameters: {},
        reason: 'Network error - try different provider',
      };
    }

    return {
      action: 'abort',
      parameters: {},
      reason: 'Unrecoverable error',
    };
  }

  /**
   * Simulates AI processing delay
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>}
   * @private
   */
  async _simulateDelay(ms) {
    const delay = this._getConfig('simulatedDelay', ms);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Adds custom plan template
   * @param {string} name - Template name
   * @param {Object} template - Template configuration
   */
  addTemplate(name, template) {
    this.planTemplates.set(name, template);
  }
}

export default MockAIProvider;
