/**
 * @fileoverview PageStateExtractor - Extract relevant page information
 * Simplifies page data for AI analysis while staying within token limits.
 */

/**
 * Page state extractor
 * Extracts and formats page information for AI decision-making
 */
export default class PageStateExtractor {
  constructor(options = {}) {
    this.maxHtmlLength = options.maxHtmlLength || 50000; // 50KB limit
    this.maxLinksCount = options.maxLinksCount || 20;
    this.maxFormsCount = options.maxFormsCount || 5;
  }

  /**
   * Extract page state from execution result
   * @param {Object} executionResult - Result from provider
   * @returns {Object} Simplified page state
   */
  extract(executionResult) {
    const state = {
      url: executionResult.url || executionResult.currentUrl,
      title: executionResult.title || null,
      html: this._simplifyHTML(executionResult.rawHtml || executionResult.html),
      links: this._extractLinks(executionResult.rawHtml || executionResult.html),
      forms: this._extractForms(executionResult.rawHtml || executionResult.html),
      interactiveElements: this._findClickables(executionResult.rawHtml || executionResult.html),
      visibleText: this._extractText(executionResult.rawHtml || executionResult.html),
      metadata: {
        timestamp: new Date().toISOString(),
        provider: executionResult.provider || 'unknown',
      },
    };

    return state;
  }

  /**
   * Simplify HTML for AI consumption
   * @private
   */
  _simplifyHTML(html) {
    if (!html) return '';

    let simplified = html;

    // Remove scripts and styles
    simplified = simplified.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    simplified = simplified.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove comments
    simplified = simplified.replace(/<!--[\s\S]*?-->/g, '');
    
    // Collapse whitespace
    simplified = simplified.replace(/\s+/g, ' ').trim();

    // Limit length
    if (simplified.length > this.maxHtmlLength) {
      simplified = simplified.substring(0, this.maxHtmlLength) + '...[truncated]';
    }

    return simplified;
  }

  /**
   * Extract links from HTML
   * @private
   */
  _extractLinks(html) {
    if (!html) return [];

    const links = [];
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;
    let count = 0;

    while ((match = linkRegex.exec(html)) !== null && count < this.maxLinksCount) {
      links.push({
        href: match[1],
        text: match[2].replace(/<[^>]+>/g, '').trim(),
      });
      count++;
    }

    return links;
  }

  /**
   * Extract forms from HTML
   * @private
   */
  _extractForms(html) {
    if (!html) return [];

    const forms = [];
    const formRegex = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
    let match;
    let count = 0;

    while ((match = formRegex.exec(html)) !== null && count < this.maxFormsCount) {
      const formHtml = match[1];
      const inputs = this._extractInputs(formHtml);

      forms.push({
        action: (match[0].match(/action="([^"]*)"/) || [])[1] || '',
        method: (match[0].match(/method="([^"]*)"/) || [])[1] || 'get',
        inputs,
      });
      count++;
    }

    return forms;
  }

  /**
   * Extract input fields from form HTML
   * @private
   */
  _extractInputs(formHtml) {
    const inputs = [];
    const inputRegex = /<input\b[^>]*>/gi;
    let match;

    while ((match = inputRegex.exec(formHtml)) !== null) {
      const inputTag = match[0];
      const type = (inputTag.match(/type="([^"]*)"/) || [])[1] || 'text';
      const name = (inputTag.match(/name="([^"]*)"/) || [])[1] || '';
      const id = (inputTag.match(/id="([^"]*)"/) || [])[1] || '';

      if (name || id) {
        inputs.push({ type, name, id });
      }
    }

    return inputs;
  }

  /**
   * Find clickable elements
   * @private
   */
  _findClickables(html) {
    if (!html) return [];

    const clickables = [];
    
    // Buttons
    const buttonRegex = /<button\b[^>]*>(.*?)<\/button>/gi;
    let match;

    while ((match = buttonRegex.exec(html)) !== null) {
      clickables.push({
        type: 'button',
        text: match[1].replace(/<[^>]+>/g, '').trim(),
      });
    }

    return clickables.slice(0, 10); // Limit to 10
  }

  /**
   * Extract visible text
   * @private
   */
  _extractText(html) {
    if (!html) return '';

    // Remove all tags
    let text = html.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Limit length
    if (text.length > 2000) {
      text = text.substring(0, 2000) + '...[truncated]';
    }

    return text;
  }

  /**
   * Create summary for AI prompt
   * @param {Object} pageState - Page state
   * @returns {string} Human-readable summary
   */
  summarizeForAI(pageState) {
    const parts = [];

    parts.push(`URL: ${pageState.url}`);
    
    if (pageState.title) {
      parts.push(`Title: ${pageState.title}`);
    }

    if (pageState.links.length > 0) {
      parts.push(`Links (${pageState.links.length}):`);
      pageState.links.slice(0, 10).forEach((link, i) => {
        parts.push(`  ${i + 1}. "${link.text}" → ${link.href}`);
      });
    }

    if (pageState.forms.length > 0) {
      parts.push(`Forms (${pageState.forms.length}):`);
      pageState.forms.forEach((form, i) => {
        parts.push(`  Form ${i + 1}: ${form.inputs.length} inputs`);
      });
    }

    if (pageState.visibleText) {
      parts.push(`Visible text: ${pageState.visibleText.substring(0, 500)}...`);
    }

    return parts.join('\n');
  }
}
