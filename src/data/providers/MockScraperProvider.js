/**
 * @fileoverview MockScraperProvider - Scraper-based automation provider
 * Simulates HTML scraping with static fixtures.
 * Medium speed and reliability, fallback from API strategy.
 */

const { BaseProvider } = require('./BaseProvider');
const { ActionType } = require('../../models/AutomationAction');
const { ExecutionResult } = require('../../models/ExecutionResult');

/**
 * Mock Scraper Provider
 * Simulates HTML scraping using static HTML fixtures
 * @class
 * @extends BaseProvider
 */
class MockScraperProvider extends BaseProvider {
  /**
   * @param {Object} [config] - Provider configuration
   * @param {number} [config.simulatedLatency=200] - Simulated scraping latency in ms
   */
  constructor(config = {}) {
    super('MockScraperProvider', {
      simulatedLatency: 200,
      ...config,
    });

    // HTML fixtures store
    this.htmlFixtures = this._initializeHtmlFixtures();
    this.currentPageHtml = null;
    this.currentPageUrl = null;
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
      speed: 'medium',
      reliability: 'medium',
    };
  }

  /**
   * Initializes HTML fixtures
   * @returns {Object} HTML fixtures
   * @private
   */
  _initializeHtmlFixtures() {
    return {
      'https://example.com': `
        <!DOCTYPE html>
        <html>
          <head><title>Example Domain</title></head>
          <body>
            <h1>Example Domain</h1>
            <p>This domain is for use in illustrative examples in documents.</p>
          </body>
        </html>
      `,
      'https://marketplace-a.com/search?q=iPhone+14': `
        <!DOCTYPE html>
        <html>
          <head><title>Search Results - Marketplace A</title></head>
          <body>
            <h1>Search Results</h1>
            <div class="search-results">
              <div class="product">
                <h2 class="product-title">iPhone 14 Pro 128GB</h2>
                <span class="product-price">$999.00</span>
                <a href="/product/123" class="product-link">View Details</a>
              </div>
              <div class="product">
                <h2 class="product-title">iPhone 14 256GB</h2>
                <span class="product-price">$899.00</span>
                <a href="/product/124" class="product-link">View Details</a>
              </div>
            </div>
          </body>
        </html>
      `,
      'https://marketplace-b.com/search?q=iPhone+14': `
        <!DOCTYPE html>
        <html>
          <head><title>iPhone 14 - Marketplace B</title></head>
          <body>
            <div class="results">
              <div class="item">
                <h3 class="product-title">iPhone 14 Pro Max</h3>
                <div class="product-price">$1099.00</div>
              </div>
              <div class="item">
                <h3 class="product-title">iPhone 14 Plus</h3>
                <div class="product-price">$949.00</div>
              </div>
            </div>
          </body>
        </html>
      `,
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
      // Simulate scraping latency
      await this._simulateLatency();

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
    const html = this.htmlFixtures[url];

    if (!html) {
      return ExecutionResult.failure(
        this._createError(`No HTML fixture found for URL: ${url}`)
      );
    }

    this.currentPageHtml = html;
    this.currentPageUrl = url;

    // Extract title from HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';

    return ExecutionResult.success({
      url,
      statusCode: 200,
      title,
    }, {
      providerUsed: this.name,
      strategyType: 'SCRAPER',
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
    
    // Build search URL
    const searchUrl = `https://marketplace-a.com/search?q=${encodeURIComponent(query)}`;
    
    // Navigate to search page
    this._handleNavigate({ 
      type: ActionType.NAVIGATE, 
      parameters: { url: searchUrl } 
    });

    // Extract product data from current page
    const products = this._extractProducts();

    return ExecutionResult.success({
      results: products.slice(0, maxResults),
      totalCount: products.length,
      query,
    }, {
      providerUsed: this.name,
      strategyType: 'SCRAPER',
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

    if (!this.currentPageHtml) {
      return ExecutionResult.failure(
        this._createError('No page loaded. Call NAVIGATE first')
      );
    }

    const extractedTexts = this._querySelectorText(selector, multiple);

    if (extractedTexts.length === 0) {
      return ExecutionResult.failure(
        this._createError(`Selector not found: ${selector}`)
      );
    }

    const processedTexts = trim 
      ? extractedTexts.map(text => text.trim())
      : extractedTexts;

    return ExecutionResult.success({
      text: multiple ? processedTexts : processedTexts[0],
      count: extractedTexts.length,
    }, {
      providerUsed: this.name,
      strategyType: 'SCRAPER',
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

    if (!this.currentPageHtml) {
      return ExecutionResult.failure(
        this._createError('No page loaded. Call NAVIGATE first')
      );
    }

    const extractedAttrs = this._querySelectorAttribute(selector, attribute, multiple);

    if (extractedAttrs.length === 0) {
      return ExecutionResult.failure(
        this._createError(`Selector not found or attribute missing: ${selector}[${attribute}]`)
      );
    }

    return ExecutionResult.success({
      value: multiple ? extractedAttrs : extractedAttrs[0],
      count: extractedAttrs.length,
    }, {
      providerUsed: this.name,
      strategyType: 'SCRAPER',
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
      strategyType: 'SCRAPER',
    });
  }

  /**
   * Extracts products from current page HTML
   * @returns {Array<Object>} Product data
   * @private
   */
  _extractProducts() {
    const products = [];
    
    // Simple regex-based extraction (in real scraper, would use DOM parser)
    const productRegex = /<div class="product">[\s\S]*?<h2 class="product-title">(.*?)<\/h2>[\s\S]*?<span class="product-price">(.*?)<\/span>/g;
    
    let match;
    while ((match = productRegex.exec(this.currentPageHtml)) !== null) {
      products.push({
        title: match[1],
        price: match[2],
      });
    }

    return products;
  }

  /**
   * Simulates querySelector for text extraction
   * @param {string} selector - CSS selector
   * @param {boolean} multiple - Extract from multiple elements
   * @returns {Array<string>} Extracted texts
   * @private
   */
  _querySelectorText(selector, multiple) {
    // Simple regex-based selector matching (mock implementation)
    const texts = [];
    
    // Convert CSS selector to regex pattern (very simplified)
    const tagMatch = selector.match(/^([a-z0-9]+)/i);
    const classMatch = selector.match(/\.([a-z0-9-_]+)/i);
    
    let pattern;
    if (classMatch) {
      const className = classMatch[1];
      pattern = new RegExp(`<[^>]*class="[^"]*${className}[^"]*"[^>]*>(.*?)</`, 'gi');
    } else if (tagMatch) {
      const tag = tagMatch[1];
      pattern = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gi');
    } else {
      return texts;
    }

    let match;
    while ((match = pattern.exec(this.currentPageHtml)) !== null) {
      texts.push(match[1].replace(/<[^>]+>/g, '')); // Strip HTML tags
      if (!multiple) break;
    }

    return texts;
  }

  /**
   * Simulates querySelector for attribute extraction
   * @param {string} selector - CSS selector
   * @param {string} attribute - Attribute name
   * @param {boolean} multiple - Extract from multiple elements
   * @returns {Array<string>} Extracted attribute values
   * @private
   */
  _querySelectorAttribute(selector, attribute, multiple) {
    const values = [];
    
    // Simple attribute extraction (mock implementation)
    const pattern = new RegExp(`<a[^>]*class="product-link"[^>]*href="([^"]*)"`, 'gi');
    
    let match;
    while ((match = pattern.exec(this.currentPageHtml)) !== null) {
      values.push(match[1]);
      if (!multiple) break;
    }

    return values;
  }

  /**
   * Simulates scraping latency
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
   * Adds HTML fixture for a URL
   * @param {string} url - Page URL
   * @param {string} html - HTML content
   */
  addHtmlFixture(url, html) {
    this.htmlFixtures[url] = html;
  }

  /**
   * Performs health check
   * @returns {Promise<{healthy: boolean}>} Health check result
   * @protected
   */
  async _performHealthCheck() {
    return {
      healthy: true,
      fixtureCount: Object.keys(this.htmlFixtures).length,
      currentPageLoaded: this.currentPageUrl !== null,
    };
  }
}

module.exports = { MockScraperProvider };
