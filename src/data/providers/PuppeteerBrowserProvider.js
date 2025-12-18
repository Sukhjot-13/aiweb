/**
 * @fileoverview PuppeteerBrowserProvider - Real browser automation
 * Uses Puppeteer to control Chrome for actual web navigation.
 */

const { BaseProvider } = require('./BaseProvider');
const puppeteer = require('puppeteer');

/**
 * Puppeteer browser provider
 * Provides real browser automation capabilities
 * @extends BaseProvider
 */
class PuppeteerBrowserProvider extends BaseProvider {
  constructor(options = {}) {
    super('Puppeteer', { strategyType: 'BROWSER' });
    this.options = {
      headless: options.headless !== false, // Default: true
      slowMo: options.slowMo || 0,
      defaultTimeout: options.defaultTimeout || 30000,
      ...options,
    };
    this.browser = null;
    this.page = null;
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
   * Initialize browser
   */
  async _initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        slowMo: this.options.slowMo,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.page = await this.browser.newPage();
      await this.page.setDefaultTimeout(this.options.defaultTimeout);
    }
  }

  /**
   * Execute automation action
   * @param {AutomationAction} action - Action to execute
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async executeAction(action) {
    await this._initBrowser();

    try {
      let result;

      switch (action.type) {
        case 'NAVIGATE':
          result = await this._handleNavigate(action);
          break;
        case 'CLICK':
          result = await this._handleClick(action);
          break;
        case 'TYPE':
          result = await this._handleType(action);
          break;
        case 'EXTRACT_TEXT':
          result = await this._handleExtractText(action);
          break;
        case 'EXTRACT_ATTRIBUTE':
          result = await this._handleExtractAttribute(action);
          break;
        case 'WAIT':
          result = await this._handleWait(action);
          break;
        default:
          throw this._createError(
            `Action type ${action.type} not supported by Puppeteer provider`
          );
      }

      // Import ExecutionResult and return success
      const { ExecutionResult } = require('../../models/ExecutionResult');
      return ExecutionResult.success(result, {
        providerUsed: this.name,
        strategyType: 'BROWSER',
      });
    } catch (error) {
      const { ExecutionResult } = require('../../models/ExecutionResult');
      return ExecutionResult.failure(this._createError(error.message || String(error)));
    }
  }

  /**
   * Handle NAVIGATE action
   * @private
   */
  async _handleNavigate(action) {
    const { url, waitForLoad = true, timeout } = action.parameters;

    const response = await this.page.goto(url, {
      waitUntil: waitForLoad ? 'networkidle2' : 'domcontentloaded',
      timeout: timeout || this.options.defaultTimeout,
    });

    const currentUrl = this.page.url();
    const title = await this.page.title();
    const html = await this.page.content();

    return {
      url: currentUrl,
      title,
      statusCode: response.status(),
      rawHtml: html,
      currentUrl,
    };
  }

  /**
   * Handle CLICK action
   * @private
   */
  async _handleClick(action) {
    const { selector, waitForNavigation = false, timeout } = action.parameters;

    await this.page.waitForSelector(selector, { timeout: timeout || 5000 });

    if (waitForNavigation) {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
        this.page.click(selector),
      ]);
    } else {
      await this.page.click(selector);
    }

    return {
      clicked: true,
      navigated: waitForNavigation,
      currentUrl: this.page.url(),
    };
  }

  /**
   * Handle TYPE action
   * @private
   */
  async _handleType(action) {
    const { selector, text, delay = 0, clearFirst = true } = action.parameters;

    await this.page.waitForSelector(selector, { timeout: 5000 });

    if (clearFirst) {
      await this.page.click(selector, { clickCount: 3 }); // Select all
      await this.page.keyboard.press('Backspace');
    }

    await this.page.type(selector, text, { delay });

    const value = await this.page.$eval(selector, el => el.value || el.textContent);

    return {
      typed: true,
      value,
    };
  }

  /**
   * Handle EXTRACT_TEXT action
   * @private
   */
  async _handleExtractText(action) {
    const { selector, multiple = false, trim = true } = action.parameters;

    await this.page.waitForSelector(selector, { timeout: 5000 });

    let text;
    let count;

    if (multiple) {
      const elements = await this.page.$$(selector);
      count = elements.length;
      
      text = await Promise.all(
        elements.map(async (el) => {
          let t = await el.evaluate(node => node.textContent);
          return trim ? t.trim() : t;
        })
      );
    } else {
      const element = await this.page.$(selector);
      count = element ? 1 : 0;
      
      text = await element.evaluate(node => node.textContent);
      if (trim) text = text.trim();
    }

    return {
      text,
      count,
    };
  }

  /**
   * Handle EXTRACT_ATTRIBUTE action
   * @private
   */
  async _handleExtractAttribute(action) {
    const { selector, attribute, multiple = false } = action.parameters;

    await this.page.waitForSelector(selector, { timeout: 5000 });

    let value;
    let count;

    if (multiple) {
      const elements = await this.page.$$(selector);
      count = elements.length;
      
      value = await Promise.all(
        elements.map(el => el.evaluate((node, attr) => node.getAttribute(attr), attribute))
      );
    } else {
      const element = await this.page.$(selector);
      count = element ? 1 : 0;
      
      value = await element.evaluate((node, attr) => node.getAttribute(attr), attribute);
    }

    return {
      value,
      count,
    };
  }

  /**
   * Handle WAIT action
   * @private
   */
  async _handleWait(action) {
    const { duration, selector, condition } = action.parameters;

    const startTime = Date.now();

    if (duration) {
      await new Promise(resolve => setTimeout(resolve, duration));
    } else if (selector) {
      const options = {};
      
      if (condition === 'hidden') {
        options.hidden = true;
      } else if (condition === 'visible') {
        options.visible = true;
      }

      await this.page.waitForSelector(selector, {
        ...options,
        timeout: 30000,
      });
    }

    return {
      completed: true,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Check if provider supports action type
   * @param {string} actionType - Action type
   * @returns {boolean}
   */
  supports(actionType) {
    const supported = ['NAVIGATE', 'CLICK', 'TYPE', 'EXTRACT_TEXT', 'EXTRACT_ATTRIBUTE', 'WAIT'];
    return supported.includes(actionType);
  }

  /**
   * Get current page state (for Phase 5)
   * @returns {Promise<Object>} Page state
   */
  async getPageState() {
    if (!this.page) return null;

    const url = this.page.url();
    const title = await this.page.title();
    const html = await this.page.content();

    return {
      url,
      title,
      html,
      rawHtml: html,
    };
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Get provider statistics
   * @returns {Object}
   */
  getStats() {
    return {
      ...super.getStats(),
      browserActive: !!this.browser,
      headless: this.options.headless,
    };
  }
}

module.exports = { PuppeteerBrowserProvider };
