/**
 * @fileoverview MockBrowserProvider - Browser-based automation provider
 * Simulates browser automation without actual browser instance.
 * Slowest but most comprehensive strategy, last resort fallback.
 */

const { BaseProvider } = require('./BaseProvider');
const { ActionType } = require('../../models/AutomationAction');
const { ExecutionResult } = require('../../models/ExecutionResult');

/**
 * Simulated page state
 * @typedef {Object} PageState
 * @property {string} url - Current URL
 * @property {string} title - Page title
 * @property {Object} dom - Simulated DOM structure
 * @property {Object} forms - Form states
 */

/**
 * Mock Browser Provider
 * Simulates browser-like behavior including interactions
 * @class
 * @extends BaseProvider
 */
class MockBrowserProvider extends BaseProvider {
  /**
   * @param {Object} [config] - Provider configuration
   * @param {number} [config.simulatedLatency=500] - Simulated browser latency in ms
   */
  constructor(config = {}) {
    super('MockBrowserProvider', {
      simulatedLatency: 500,
      ...config,
    });

    // Simulated browser state
    this.pageState = null;
    this.navigationHistory = [];
  }

  /**
   * Defines provider capabilities
   * @returns {Object} Capability flags
   * @protected
   */
  _defineCapabilities() {
    return {
      supportsNavigation: true,
      supportsSearch: true,
      supportsExtraction: true,
      supportsInteraction: true,
      supportsPagination: true,
      supportsFileUpload: true,
      requiresJavaScript: true,
      speed: 'slow',
      reliability: 'high',
    };
  }

  /**
   * Executes an automation action
   * @param {AutomationAction} action - Action to execute
   * @param {Object} [context] - Execution context
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeAction(action, _context = {}) {
    this._validateAction(action);

    return this._wrapExecution(async () => {
      // Simulate browser latency
      await this._simulateLatency();

      switch (action.type) {
        case ActionType.NAVIGATE:
          return this._handleNavigate(action);
        case ActionType.CLICK:
          return this._handleClick(action);
        case ActionType.TYPE:
          return this._handleType(action);
        case ActionType.EXTRACT_TEXT:
          return this._handleExtractText(action);
        case ActionType.EXTRACT_ATTRIBUTE:
          return this._handleExtractAttribute(action);
        case ActionType.WAIT:
          return this._handleWait(action);
        case ActionType.SEARCH:
          return this._handleSearch(action);
        default:
          throw this._createActionNotSupportedError(action.type);
      }
    });
  }

  /**
   * Handles NAVIGATE action
   * @param {AutomationAction} action - Navigate action
   * @returns {ExecutionResult} Navigation result
   * @private
   */
  _handleNavigate(action) {
    const { url } = action.parameters;

    // Create simulated page state
    this.pageState = this._createPageState(url);
    this.navigationHistory.push(url);

    return ExecutionResult.success({
      url: this.pageState.url,
      statusCode: 200,
      title: this.pageState.title,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Handles CLICK action
   * @param {AutomationAction} action - Click action
   * @returns {ExecutionResult} Click result
   * @private
   */
  _handleClick(action) {
    const { selector } = action.parameters;

    if (!this.pageState) {
      return ExecutionResult.failure(
        this._createError('No page loaded. Call NAVIGATE first')
      );
    }

    // Simulate finding element
    const element = this._findElement(selector);

    if (!element) {
      return ExecutionResult.failure(
        this._createError(`Element not found: ${selector}`)
      );
    }

    // Simulate click
    element.clicked = true;

    // Simulate navigation if element is a link
    let navigated = false;
    if (element.type === 'link' && element.href) {
      this._handleNavigate({ 
        type: ActionType.NAVIGATE, 
        parameters: { url: element.href } 
      });
      navigated = true;
    }

    return ExecutionResult.success({
      clicked: true,
      navigated,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Handles TYPE action
   * @param {AutomationAction} action - Type action
   * @returns {ExecutionResult} Type result
   * @private
   */
  _handleType(action) {
    const { selector, text, clearFirst = true } = action.parameters;

    if (!this.pageState) {
      return ExecutionResult.failure(
        this._createError('No page loaded. Call NAVIGATE first')
      );
    }

    // Simulate finding input element
    const element = this._findElement(selector);

    if (!element || element.type !== 'input') {
      return ExecutionResult.failure(
        this._createError(`Input element not found: ${selector}`)
      );
    }

    // Simulate typing
    if (clearFirst) {
      element.value = text;
    } else {
      element.value = (element.value || '') + text;
    }

    return ExecutionResult.success({
      typed: true,
      value: element.value,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Handles EXTRACT_TEXT action
   * @param {AutomationAction} action - Extract text action
   * @returns {ExecutionResult} Extraction result
   * @private
   */
  _handleExtractText(action) {
    const { selector, multiple = false, trim = true } = action.parameters;

    if (!this.pageState) {
      return ExecutionResult.failure(
        this._createError('No page loaded. Call NAVIGATE first')
      );
    }

    const elements = this._findElements(selector, multiple);

    if (elements.length === 0) {
      return ExecutionResult.failure(
        this._createError(`Selector not found: ${selector}`)
      );
    }

    const texts = elements.map(el => {
      const text = el.text || '';
      return trim ? text.trim() : text;
    });

    return ExecutionResult.success({
      text: multiple ? texts : texts[0],
      count: texts.length,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Handles EXTRACT_ATTRIBUTE action
   * @param {AutomationAction} action - Extract attribute action
   * @returns {ExecutionResult} Extraction result
   * @private
   */
  _handleExtractAttribute(action) {
    const { selector, attribute, multiple = false } = action.parameters;

    if (!this.pageState) {
      return ExecutionResult.failure(
        this._createError('No page loaded. Call NAVIGATE first')
      );
    }

    const elements = this._findElements(selector, multiple);

    if (elements.length === 0) {
      return ExecutionResult.failure(
        this._createError(`Selector not found: ${selector}`)
      );
    }

    const values = elements.map(el => el[attribute] || null).filter(v => v !== null);

    if (values.length === 0) {
      return ExecutionResult.failure(
        this._createError(`Attribute ${attribute} not found on elements`)
      );
    }

    return ExecutionResult.success({
      value: multiple ? values : values[0],
      count: values.length,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Handles WAIT action
   * @param {AutomationAction} action - Wait action
   * @returns {Promise<ExecutionResult>} Wait result
   * @private
   */
  async _handleWait(action) {
    const { duration = 0, selector } = action.parameters;
    
    const startTime = Date.now();

    if (selector) {
      // Simulate waiting for selector
      await new Promise(resolve => setTimeout(resolve, duration || 100));
      const element = this._findElement(selector);
      
      if (!element) {
        return ExecutionResult.failure(
          this._createError(`Timeout waiting for selector: ${selector}`)
        );
      }
    } else if (duration > 0) {
      await new Promise(resolve => setTimeout(resolve, duration));
    }

    const actualDuration = Date.now() - startTime;

    return ExecutionResult.success({
      completed: true,
      duration: actualDuration,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Handles SEARCH action
   * @param {AutomationAction} action - Search action
   * @returns {ExecutionResult} Search result
   * @private
   */
  _handleSearch(action) {
    const { query, maxResults = 10 } = action.parameters;

    // Simulate search by navigating and extracting
    const searchUrl = `https://marketplace-a.com/search?q=${encodeURIComponent(query)}`;
    this._handleNavigate({ 
      type: ActionType.NAVIGATE, 
      parameters: { url: searchUrl } 
    });

    // Simulate extracting search results
    const results = this.pageState.dom.searchResults || [];

    return ExecutionResult.success({
      results: results.slice(0, maxResults),
      totalCount: results.length,
      query,
    }, {
      providerUsed: this.name,
      strategyType: 'BROWSER',
    });
  }

  /**
   * Creates simulated page state for a URL
   * @param {string} url - Page URL
   * @returns {PageState} Simulated page state
   * @private
   */
  _createPageState(url) {
    // Create mock DOM based on URL
    const mockDom = {
      searchResults: [
        { title: 'iPhone 14 Pro', price: '$999', href: '/product/1' },
        { title: 'iPhone 14', price: '$799', href: '/product/2' },
      ],
      elements: {
        'h1': { type: 'heading', text: 'Mock Page Title' },
        '.product-price': { type: 'text', text: '$999.00' },
        '.product-title': { type: 'text', text: 'Product Name' },
        '#search-input': { type: 'input', value: '' },
        'a.product-link': { type: 'link', text: 'View Product', href: '/product/123' },
      },
    };

    return {
      url,
      title: `Mock Page - ${url}`,
      dom: mockDom,
      forms: {},
    };
  }

  /**
   * Finds a single element by selector
   * @param {string} selector - CSS selector
   * @returns {Object|null} Element or null
   * @private
   */
  _findElement(selector) {
    if (!this.pageState || !this.pageState.dom) {
      return null;
    }

    return this.pageState.dom.elements[selector] || null;
  }

  /**
   * Finds elements by selector
   * @param {string} selector - CSS selector
   * @param {boolean} multiple - Find multiple elements
   * @returns {Array<Object>} Array of elements
   * @private
   */
  _findElements(selector, multiple) {
    const element = this._findElement(selector);
    
    if (!element) {
      return [];
    }

    // Simulate multiple elements by returning array
    return multiple ? [element, element] : [element];
  }

  /**
   * Simulates browser latency
   * @returns {Promise<void>}
   * @private
   */
  async _simulateLatency() {
    const latency = this.config.simulatedLatency || 0;
    if (latency > 0) {
      await new Promise(resolve => setTimeout(resolve, latency));
    }
  }

  /**
   * Gets current page state
   * @returns {PageState|null} Current page state
   */
  getPageState() {
    return this.pageState;
  }

  /**
   * Gets navigation history
   * @returns {Array<string>} URLs visited
   */
  getNavigationHistory() {
    return [...this.navigationHistory];
  }

  /**
   * Performs health check
   * @returns {Promise<{healthy: boolean}>} Health check result
   * @protected
   */
  async _performHealthCheck() {
    return {
      healthy: true,
      pageLoaded: this.pageState !== null,
      navigationHistorySize: this.navigationHistory.length,
    };
  }
}

module.exports = { MockBrowserProvider };
