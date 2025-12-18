/**
 * @fileoverview MockApiProvider - API-based automation provider
 * Simulates API-based data access with mock responses.
 * Fastest and most reliable strategy for testing.
 */

const { BaseProvider } = require('./BaseProvider');
const { ActionType } = require('../../models/AutomationAction');
const { ExecutionResult } = require('../../models/ExecutionResult');

/**
 * Mock API Provider
 * Simulates API-based automation with predefined mock data
 * @class
 * @extends BaseProvider
 */
class MockApiProvider extends BaseProvider {
  /**
   * @param {Object} [config] - Provider configuration
   * @param {number} [config.simulatedLatency=100] - Simulated network latency in ms
   * @param {number} [config.failureRate=0] - Simulation failure rate (0-1)
   */
  constructor(config = {}) {
    super('MockApiProvider', {
      simulatedLatency: 100,
      failureRate: 0,
      ...config,
    });

    // Mock data store
    this.mockData = this._initializeMockData();
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
      supportsInteraction: false,
      supportsPagination: true,
      supportsFileUpload: false,
      requiresJavaScript: false,
      speed: 'fast',
      reliability: 'high',
    };
  }

  /**
   * Initializes mock data store
   * @returns {Object} Mock data
   * @private
   */
  _initializeMockData() {
    return {
      pages: {
        'https://example.com': {
          title: 'Example Domain',
          content: 'This domain is for use in illustrative examples.',
          statusCode: 200,
        },
        'https://marketplace-a.com': {
          title: 'Marketplace A',
          content: 'Product listings from Marketplace A',
          statusCode: 200,
        },
        'https://marketplace-a.com/search?q=iPhone%2014': {
          title: 'Search Results - Marketplace A',
          content: 'iPhone 14 search results',
          statusCode: 200,
        },
        'https://marketplace-b.com': {
          title: 'Marketplace B',
          content: 'Product listings from Marketplace B',
          statusCode: 200,
        },
        'https://marketplace-b.com/search?q=iPhone%2014': {
          title: 'Search Results - Marketplace B',
          content: 'iPhone 14 search results',
          statusCode: 200,
        },
      },
      searchResults: {
        'iPhone 14': [
          { title: 'iPhone 14 Pro 128GB', price: 999, currency: 'USD', url: 'https://marketplace-a.com/iphone14-1' },
          { title: 'iPhone 14 256GB', price: 899, currency: 'USD', url: 'https://marketplace-a.com/iphone14-2' },
        ],
        'laptop': [
          { title: 'Dell XPS 13', price: 1299, currency: 'USD', url: 'https://marketplace-a.com/laptop-1' },
          { title: 'MacBook Air M2', price: 1199, currency: 'USD', url: 'https://marketplace-a.com/laptop-2' },
        ],
      },
      extractedData: {
        '.product-price': '$999.00',
        '.product-title': 'iPhone 14 Pro',
        'h1': 'Example Domain',
      },
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
      // Simulate network latency
      await this._simulateLatency();

      // Simulate random failures if configured
      if (this._shouldSimulateFailure()) {
        throw this._createError('Simulated API failure');
      }

      switch (action.type) {
        case ActionType.NAVIGATE:
          return this._handleNavigate(action);
        case ActionType.SEARCH:
          return this._handleSearch(action);
        case ActionType.EXTRACT_TEXT:
          return this._handleExtractText(action);
        case ActionType.EXTRACT_ATTRIBUTE:
          return this._handleExtractAttribute(action);
        case ActionType.WAIT:
          return this._handleWait(action);
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
    const pageData = this.mockData.pages[url];

    if (!pageData) {
      return ExecutionResult.failure(
        this._createError(`Page not found in mock data: ${url}`)
      );
    }

    return ExecutionResult.success({
      url,
      statusCode: pageData.statusCode,
      title: pageData.title,
    }, {
      providerUsed: this.name,
      strategyType: 'API',
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
    
    // Find matching results (case-insensitive partial match)
    let results = [];
    for (const [searchKey, searchResults] of Object.entries(this.mockData.searchResults)) {
      if (query.toLowerCase().includes(searchKey.toLowerCase()) || 
          searchKey.toLowerCase().includes(query.toLowerCase())) {
        results = searchResults;
        break;
      }
    }

    // Limit results
    results = results.slice(0, maxResults);

    return ExecutionResult.success({
      results,
      totalCount: results.length,
      query,
    }, {
      providerUsed: this.name,
      strategyType: 'API',
    });
  }

  /**
   * Handles EXTRACT_TEXT action
   * @param {AutomationAction} action - Extract text action
   * @returns {ExecutionResult} Extraction result
   * @private
   */
  _handleExtractText(action) {
    const { selector, multiple = false } = action.parameters;
    
    const extractedText = this.mockData.extractedData[selector];

    if (!extractedText) {
      return ExecutionResult.failure(
        this._createError(`Selector not found in mock data: ${selector}`)
      );
    }

    return ExecutionResult.success({
      text: multiple ? [extractedText] : extractedText,
      count: multiple ? 1 : 1,
    }, {
      providerUsed: this.name,
      strategyType: 'API',
    });
  }

  /**
   * Handles EXTRACT_ATTRIBUTE action
   * @param {AutomationAction} action - Extract attribute action
   * @returns {ExecutionResult} Extraction result
   * @private
   */
  _handleExtractAttribute(action) {
    const { attribute, multiple = false } = action.parameters;
    
    // Mock attribute extraction
    const mockAttribute = `https://example.com/${attribute}`;

    return ExecutionResult.success({
      value: multiple ? [mockAttribute] : mockAttribute,
      count: 1,
    }, {
      providerUsed: this.name,
      strategyType: 'API',
    });
  }

  /**
   * Handles WAIT action
   * @param {AutomationAction} action - Wait action
   * @returns {Promise<ExecutionResult>} Wait result
   * @private
   */
  async _handleWait(action) {
    const { duration = 0 } = action.parameters;
    
    const startTime = Date.now();
    if (duration > 0) {
      await new Promise(resolve => setTimeout(resolve, duration));
    }
    const actualDuration = Date.now() - startTime;

    return ExecutionResult.success({
      completed: true,
      duration: actualDuration,
    }, {
      providerUsed: this.name,
      strategyType: 'API',
    });
  }

  /**
   * Simulates network latency
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
   * Determines if should simulate failure
   * @returns {boolean} True if should fail
   * @private
   */
  _shouldSimulateFailure() {
    const failureRate = this.config.failureRate || 0;
    return Math.random() < failureRate;
  }

  /**
   * Adds mock page data
   * @param {string} url - Page URL
   * @param {Object} pageData - Page data
   */
  addMockPage(url, pageData) {
    this.mockData.pages[url] = pageData;
  }

  /**
   * Adds mock search results
   * @param {string} query - Search query
   * @param {Array<Object>} results - Search results
   */
  addMockSearchResults(query, results) {
    this.mockData.searchResults[query] = results;
  }

  /**
   * Adds mock extracted data
   * @param {string} selector - CSS selector
   * @param {string} data - Extracted data
   */
  addMockExtractedData(selector, data) {
    this.mockData.extractedData[selector] = data;
  }

  /**
   * Performs health check
   * @returns {Promise<{healthy: boolean}>} Health check result
   * @protected
   */
  async _performHealthCheck() {
    return {
      healthy: true,
      mockDataSize: {
        pages: Object.keys(this.mockData.pages).length,
        searchResults: Object.keys(this.mockData.searchResults).length,
        extractedData: Object.keys(this.mockData.extractedData).length,
      },
    };
  }
}

module.exports = { MockApiProvider };
