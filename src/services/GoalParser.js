/**
 * @fileoverview GoalParser - Natural language goal parsing
 * Extracts structured information from user goals for task planning.
 */

/**
 * Parsed goal structure
 * @typedef {Object} ParsedGoal
 * @property {string} rawGoal - Original goal text
 * @property {string} intent - Detected intent (search, compare, extract, etc.)
 * @property {Array<string>} entities - Extracted entities (products, websites, etc.)
 * @property {Object} constraints - Extracted constraints (price range, location, etc.)
 * @property {number} confidence - Parsing confidence (0-1)
 */

/**
 * GoalParser class
 * Parses natural language goals into structured data
 * @class
 */
class GoalParser {
  constructor() {
    this.intentPatterns = this._initializeIntentPatterns();
  }

  /**
   * Parses a user goal
   * @param {string} goal - Natural language goal
   * @returns {ParsedGoal} Parsed goal structure
   */
  parse(goal) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('Goal must be a non-empty string');
    }

    const normalizedGoal = goal.trim();

    return {
      rawGoal: normalizedGoal,
      intent: this._detectIntent(normalizedGoal),
      entities: this._extractEntities(normalizedGoal),
      constraints: this._extractConstraints(normalizedGoal),
      confidence: 0.8, // Mock confidence
    };
  }

  /**
   * Initializes intent detection patterns
   * @returns {Map} Intent patterns
   * @private
   */
  _initializeIntentPatterns() {
    const patterns = new Map();

    patterns.set('search', [
      /\b(search|find|look\s+for|lookup|query)\b/i,
    ]);

    patterns.set('compare', [
      /\b(compare|cheapest|best\s+price|lowest\s+price|most\s+affordable)\b/i,
    ]);

    patterns.set('extract', [
      /\b(extract|scrape|get|fetch|collect|retrieve)\s+(data|information|content)\b/i,
    ]);

    patterns.set('monitor', [
      /\b(monitor|track|watch|observe)\b/i,
    ]);

    patterns.set('fill-form', [
      /\b(fill|submit|complete)\s+(form|application)\b/i,
    ]);

    return patterns;
  }

  /**
   * Detects intent from goal
   * @param {string} goal - Goal text
   * @returns {string} Detected intent
   * @private
   */
  _detectIntent(goal) {
    const goalLower = goal.toLowerCase();

    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(goalLower)) {
          return intent;
        }
      }
    }

    return 'general';
  }

  /**
   * Extracts entities from goal
   * @param {string} goal - Goal text
   * @returns {Array<string>} Extracted entities
   * @private
   */
  _extractEntities(goal) {
    const entities = [];

    // Extract quoted strings
    const quotedMatches = goal.match(/"([^"]+)"/g);
    if (quotedMatches) {
      entities.push(...quotedMatches.map(q => q.replace(/"/g, '')));
    }

    // Extract URLs
    const urlMatches = goal.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      entities.push(...urlMatches);
    }

    // Extract potential product names (capitalized words)
    const productMatches = goal.match(/\b[A-Z][a-z]+(\s+[A-Z0-9][a-z0-9]*)*\b/g);
    if (productMatches) {
      entities.push(...productMatches);
    }

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Extracts constraints from goal
   * @param {string} goal - Goal text
   * @returns {Object} Extracted constraints
   * @private
   */
  _extractConstraints(goal) {
    const constraints = {};

    // Extract price range
    const priceMatch = goal.match(/(?:under|below|less\s+than)\s*\$?(\d+)/i);
    if (priceMatch) {
      constraints.maxPrice = parseInt(priceMatch[1], 10);
    }

    // Extract minimum price
    const minPriceMatch = goal.match(/(?:above|over|more\s+than)\s*\$?(\d+)/i);
    if (minPriceMatch) {
      constraints.minPrice = parseInt(minPriceMatch[1], 10);
    }

    // Extract quantity
    const quantityMatch = goal.match(/(\d+)\s+(?:items|products|results)/i);
    if (quantityMatch) {
      constraints.maxResults = parseInt(quantityMatch[1], 10);
    }

    // Extract location
    const locationMatch = goal.match(/\b(?:in|from|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    if (locationMatch) {
      constraints.location = locationMatch[1];
    }

    return constraints;
  }
}

export { GoalParser };
