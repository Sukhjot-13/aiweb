/**
 * @fileoverview AutomationAction Model
 * Defines the smallest executable unit in the automation system.
 * Each action is atomic, side-effect aware, serializable, and testable in isolation.
 */

/**
 * Action type enumeration
 * @enum {string}
 * @readonly
 */
const ActionType = Object.freeze({
  NAVIGATE: 'NAVIGATE',
  CLICK: 'CLICK',
  TYPE: 'TYPE',
  EXTRACT_TEXT: 'EXTRACT_TEXT',
  EXTRACT_ATTRIBUTE: 'EXTRACT_ATTRIBUTE',
  WAIT: 'WAIT',
  SEARCH: 'SEARCH',
});

/**
 * Input parameter schemas for each action type
 * Defines required and optional parameters per action
 * @type {Object.<string, Object>}
 */
const ActionParameterSchemas = {
  [ActionType.NAVIGATE]: {
    required: ['url'],
    optional: ['waitForLoad', 'timeout'],
    schema: {
      url: { type: 'string', description: 'Target URL to navigate to' },
      waitForLoad: { type: 'boolean', default: true, description: 'Wait for page load completion' },
      timeout: { type: 'number', default: 30000, description: 'Navigation timeout in milliseconds' },
    },
  },
  [ActionType.CLICK]: {
    required: ['selector'],
    optional: ['waitForNavigation', 'timeout'],
    schema: {
      selector: { type: 'string', description: 'CSS selector for element to click' },
      waitForNavigation: { type: 'boolean', default: false, description: 'Wait for navigation after click' },
      timeout: { type: 'number', default: 5000, description: 'Click timeout in milliseconds' },
    },
  },
  [ActionType.TYPE]: {
    required: ['selector', 'text'],
    optional: ['delay', 'clearFirst'],
    schema: {
      selector: { type: 'string', description: 'CSS selector for input element' },
      text: { type: 'string', description: 'Text to type' },
      delay: { type: 'number', default: 0, description: 'Delay between keystrokes in milliseconds' },
      clearFirst: { type: 'boolean', default: true, description: 'Clear field before typing' },
    },
  },
  [ActionType.EXTRACT_TEXT]: {
    required: ['selector'],
    optional: ['multiple', 'trim'],
    schema: {
      selector: { type: 'string', description: 'CSS selector for element(s) to extract text from' },
      multiple: { type: 'boolean', default: false, description: 'Extract from multiple elements' },
      trim: { type: 'boolean', default: true, description: 'Trim whitespace from extracted text' },
    },
  },
  [ActionType.EXTRACT_ATTRIBUTE]: {
    required: ['selector', 'attribute'],
    optional: ['multiple'],
    schema: {
      selector: { type: 'string', description: 'CSS selector for element(s)' },
      attribute: { type: 'string', description: 'Attribute name to extract (e.g., "href", "src")' },
      multiple: { type: 'boolean', default: false, description: 'Extract from multiple elements' },
    },
  },
  [ActionType.WAIT]: {
    required: [],
    optional: ['duration', 'selector', 'condition'],
    schema: {
      duration: { type: 'number', description: 'Wait duration in milliseconds' },
      selector: { type: 'string', description: 'CSS selector to wait for' },
      condition: { type: 'string', enum: ['visible', 'hidden', 'stable'], description: 'Wait condition' },
    },
  },
  [ActionType.SEARCH]: {
    required: ['query'],
    optional: ['filters', 'maxResults'],
    schema: {
      query: { type: 'string', description: 'Search query string' },
      filters: { type: 'object', description: 'Additional search filters' },
      maxResults: { type: 'number', default: 10, description: 'Maximum number of results to return' },
    },
  },
};

/**
 * Output schemas for each action type
 * Defines the expected structure of action results
 * @type {Object.<string, Object>}
 */
const ActionOutputSchemas = {
  [ActionType.NAVIGATE]: {
    url: { type: 'string', description: 'Final URL after navigation (may differ due to redirects)' },
    statusCode: { type: 'number', description: 'HTTP status code' },
    title: { type: 'string', description: 'Page title' },
  },
  [ActionType.CLICK]: {
    clicked: { type: 'boolean', description: 'Whether click was successful' },
    navigated: { type: 'boolean', description: 'Whether navigation occurred after click' },
  },
  [ActionType.TYPE]: {
    typed: { type: 'boolean', description: 'Whether text was successfully typed' },
    value: { type: 'string', description: 'Final value in the field' },
  },
  [ActionType.EXTRACT_TEXT]: {
    text: { type: ['string', 'array'], description: 'Extracted text (string or array if multiple=true)' },
    count: { type: 'number', description: 'Number of elements matched' },
  },
  [ActionType.EXTRACT_ATTRIBUTE]: {
    value: { type: ['string', 'array'], description: 'Extracted attribute value(s)' },
    count: { type: 'number', description: 'Number of elements matched' },
  },
  [ActionType.WAIT]: {
    completed: { type: 'boolean', description: 'Whether wait condition was met' },
    duration: { type: 'number', description: 'Actual wait duration in milliseconds' },
  },
  [ActionType.SEARCH]: {
    results: { type: 'array', description: 'Array of search results' },
    totalCount: { type: 'number', description: 'Total number of results found' },
    query: { type: 'string', description: 'Normalized query that was executed' },
  },
};

/**
 * Creates a new AutomationAction
 * @class
 */
class AutomationAction {
  /**
   * @param {Object} config - Action configuration
   * @param {string} config.type - Action type (must be from ActionType enum)
   * @param {Object} config.parameters - Action parameters
   * @param {string} [config.id] - Unique action identifier (auto-generated if not provided)
   * @param {Object} [config.metadata] - Additional metadata
   * @throws {Error} If action configuration is invalid
   */
  constructor({ type, parameters, id, metadata = {} }) {
    if (!type || !Object.values(ActionType).includes(type)) {
      throw new Error(`Invalid action type: ${type}. Must be one of: ${Object.values(ActionType).join(', ')}`);
    }

    this.id = id || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.parameters = parameters || {};
    this.metadata = {
      createdAt: new Date().toISOString(),
      ...metadata,
    };

    // Validate parameters
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(`Invalid action parameters: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Validates the action's parameters against its schema
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  validate() {
    const errors = [];
    const schema = ActionParameterSchemas[this.type];

    if (!schema) {
      return { valid: false, errors: [`No schema defined for action type: ${this.type}`] };
    }

    // Check required parameters
    for (const requiredParam of schema.required) {
      if (!(requiredParam in this.parameters)) {
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }

    // Validate parameter types
    const allParams = [...schema.required, ...schema.optional];
    for (const [paramName, paramValue] of Object.entries(this.parameters)) {
      if (!allParams.includes(paramName)) {
        errors.push(`Unknown parameter: ${paramName}`);
        continue;
      }

      const paramSchema = schema.schema[paramName];
      if (!paramSchema) continue;

      // Type validation
      const actualType = Array.isArray(paramValue) ? 'array' : typeof paramValue;
      if (paramSchema.type && actualType !== paramSchema.type && !Array.isArray(paramSchema.type)) {
        errors.push(`Parameter ${paramName} must be of type ${paramSchema.type}, got ${actualType}`);
      }

      // Enum validation
      if (paramSchema.enum && !paramSchema.enum.includes(paramValue)) {
        errors.push(`Parameter ${paramName} must be one of: ${paramSchema.enum.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets the expected output schema for this action
   * @returns {Object} Output schema
   */
  getOutputSchema() {
    return ActionOutputSchemas[this.type] || {};
  }

  /**
   * Serializes the action to a plain object
   * @returns {Object} Serialized action
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      parameters: this.parameters,
      metadata: this.metadata,
    };
  }

  /**
   * Creates an AutomationAction from a plain object
   * @param {Object} json - Serialized action
   * @returns {AutomationAction} Deserialized action
   */
  static fromJSON(json) {
    return new AutomationAction(json);
  }

  /**
   * Creates a NAVIGATE action
   * @param {string} url - Target URL
   * @param {Object} [options] - Additional options
   * @returns {AutomationAction} Navigate action
   * @example
   * const action = AutomationAction.navigate('https://example.com', { timeout: 5000 });
   */
  static navigate(url, options = {}) {
    return new AutomationAction({
      type: ActionType.NAVIGATE,
      parameters: { url, ...options },
    });
  }

  /**
   * Creates a CLICK action
   * @param {string} selector - CSS selector for element to click
   * @param {Object} [options] - Additional options
   * @returns {AutomationAction} Click action
   * @example
   * const action = AutomationAction.click('.submit-button', { waitForNavigation: true });
   */
  static click(selector, options = {}) {
    return new AutomationAction({
      type: ActionType.CLICK,
      parameters: { selector, ...options },
    });
  }

  /**
   * Creates a TYPE action
   * @param {string} selector - CSS selector for input element
   * @param {string} text - Text to type
   * @param {Object} [options] - Additional options
   * @returns {AutomationAction} Type action
   * @example
   * const action = AutomationAction.type('#search-input', 'iPhone 14', { delay: 50 });
   */
  static type(selector, text, options = {}) {
    return new AutomationAction({
      type: ActionType.TYPE,
      parameters: { selector, text, ...options },
    });
  }

  /**
   * Creates an EXTRACT_TEXT action
   * @param {string} selector - CSS selector for element(s)
   * @param {Object} [options] - Additional options
   * @returns {AutomationAction} Extract text action
   * @example
   * const action = AutomationAction.extractText('.product-price', { multiple: true });
   */
  static extractText(selector, options = {}) {
    return new AutomationAction({
      type: ActionType.EXTRACT_TEXT,
      parameters: { selector, ...options },
    });
  }

  /**
   * Creates an EXTRACT_ATTRIBUTE action
   * @param {string} selector - CSS selector for element(s)
   * @param {string} attribute - Attribute name to extract
   * @param {Object} [options] - Additional options
   * @returns {AutomationAction} Extract attribute action
   * @example
   * const action = AutomationAction.extractAttribute('a.product-link', 'href', { multiple: true });
   */
  static extractAttribute(selector, attribute, options = {}) {
    return new AutomationAction({
      type: ActionType.EXTRACT_ATTRIBUTE,
      parameters: { selector, attribute, ...options },
    });
  }

  /**
   * Creates a WAIT action
   * @param {Object} options - Wait options (must specify duration, selector, or condition)
   * @returns {AutomationAction} Wait action
   * @example
   * const action = AutomationAction.wait({ selector: '.results', condition: 'visible' });
   */
  static wait(options = {}) {
    return new AutomationAction({
      type: ActionType.WAIT,
      parameters: options,
    });
  }

  /**
   * Creates a SEARCH action
   * @param {string} query - Search query
   * @param {Object} [options] - Additional options
   * @returns {AutomationAction} Search action
   * @example
   * const action = AutomationAction.search('laptop', { maxResults: 20, filters: { priceRange: '500-1000' } });
   */
  static search(query, options = {}) {
    return new AutomationAction({
      type: ActionType.SEARCH,
      parameters: { query, ...options },
    });
  }
}

module.exports = {
  AutomationAction,
  ActionType,
  ActionParameterSchemas,
  ActionOutputSchemas,
};
