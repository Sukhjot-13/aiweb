/**
 * @fileoverview Gemini AI Provider
 * 
 * Production AI provider using Google's Gemini API.
 * Implements BaseAIProvider interface for AI-powered task planning,
 * selector generation, and error recovery.
 * 
 * @architectural-principle Dependency Inversion (depends on BaseAIProvider interface)
 */

import BaseAIProvider from './BaseAIProvider.js';
import { getGenerativeModel, generateContent } from './clients/GeminiClient.js';
import AIConfig from '../config/aiConfig.js';

/**
 * Gemini AI Provider
 * @extends {BaseAIProvider}
 */
export default class GeminiAIProvider extends BaseAIProvider {
  constructor() {
    super();
    this.modelInfo = {
      name: AIConfig.getGeminiModel(),
      provider: 'gemini',
    };
  }

  /**
   * Generate task plan from natural language goal
   * 
   * @param {string} goal - Natural language goal
   * @param {Object} [context] - Additional context
   * @returns {Promise<Object>} Task plan
   */
  async generatePlan(goal, context = {}) {
    const startTime = Date.now();

    try {
      const prompt = this._buildPlanningPrompt(goal, context);
      const result = await generateContent(prompt);
      
      const response = this._extractTextFromResponse(result);
      const plan = this._parsePlanResponse(response, goal);

      // Track usage
      this._trackRequest(true, Date.now() - startTime);
      this._trackTokens(this._estimateTokens(prompt), this._estimateTokens(response));

      return plan;
    } catch (error) {
      this._trackRequest(false, Date.now() - startTime);
      throw new Error(`Gemini planning failed: ${error.message}`);
    }
  }

  /**
   * Suggest CSS selectors for extracting data from HTML
   * 
   * @param {string} html - HTML content
   * @param {string} intent - User intent (e.g., "find product prices")
   * @param {Object} [context] - Additional context
   * @returns {Promise<Object>} Selector suggestions
   */
  async suggestSelectors(html, intent, context = {}) {
    const startTime = Date.now();

    try {
      // Truncate HTML if too long (keep first 10k chars)
      const truncatedHtml = html.length > 10000 
        ? html.substring(0, 10000) + '\n... (truncated)'
        : html;

      const prompt = this._buildSelectorPrompt(truncatedHtml, intent, context);
      const result = await generateContent(prompt);
      
      const response = this._extractTextFromResponse(result);
      const suggestions = this._parseSelectorResponse(response);

      this._trackRequest(true, Date.now() - startTime);
      this._trackTokens(this._estimateTokens(prompt), this._estimateTokens(response));

      return suggestions;
    } catch (error) {
      this._trackRequest(false, Date.now() - startTime);
      throw new Error(`Gemini selector suggestion failed: ${error.message}`);
    }
  }

  /**
   * Suggest recovery actions for errors
   * 
   * @param {Error} error - Error that occurred
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Recovery suggestion
   */
  async recoverFromError(error, context = {}) {
    const startTime = Date.now();

    try {
      const prompt = this._buildRecoveryPrompt(error, context);
      const result = await generateContent(prompt);
      
      const response = this._extractTextFromResponse(result);
      const recovery = this._parseRecoveryResponse(response);

      this._trackRequest(true, Date.now() - startTime);
      this._trackTokens(this._estimateTokens(prompt), this._estimateTokens(response));

      return recovery;
    } catch (err) {
      this._trackRequest(false, Date.now() - startTime);
      throw new Error(`Gemini error recovery failed: ${err.message}`);
    }
  }

  /**
   * Build planning prompt
   * @private
   */
  _buildPlanningPrompt(goal, context) {
    return `You are an AI task planner for web automation. Convert the user's natural language goal into a structured task plan.

**User Goal**: ${goal}

${context.hints ? `**Context**: ${context.hints}` : ''}

Generate a task plan with these steps:
1. Identify the main actions needed (navigate, search, extract, compare, etc.)
2. Break down into atomic steps
3. Suggest appropriate selectors or search strategies

Respond with a JSON object in this format:
{
  "steps": [
    {
      "action": "NAVIGATE",
      "description": "Navigate to website",
      "params": { "url": "https://example.com" }
    },
    {
      "action": "SEARCH",
      "description": "Search for product",
      "params": { "query": "product name", "selector": "input[name='search']" }
    }
  ],
  "confidence": 0.9,
  "reasoning": "Brief explanation of approach"
}

Available actions: NAVIGATE, CLICK, TYPE, EXTRACT, SEARCH, WAIT, SCROLL

Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Build selector suggestion prompt
   * @private
   */
  _buildSelectorPrompt(html, intent, context) {
    return `You are an expert at finding CSS selectors in HTML. Given the HTML and user intent, suggest the best CSS selectors to extract the desired data.

**User Intent**: ${intent}

**HTML**:
\`\`\`html
${html}
\`\`\`

Suggest CSS selectors in this JSON format:
{
  "selectors": [
    {
      "purpose": "product title",
      "selector": ".product-title",
      "confidence": 0.9
    }
  ],
  "reasoning": "Why these selectors were chosen"
}

Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Build error recovery prompt
   * @private
   */
  _buildRecoveryPrompt(error, context) {
    return `You are an automation error recovery assistant. Analyze the error and suggest recovery actions.

**Error**: ${error.message}

**Context**:
- Action Type: ${context.action || 'unknown'}
- Step: ${context.stepDescription || 'unknown'}
- Previous attempts: ${context.attemptCount || 0}

Suggest recovery actions in this JSON format:
{
  "recoverable": true,
  "suggestions": [
    {
      "action": "RETRY_WITH_WAIT",
      "params": { "delayMs": 2000 },
      "reasoning": "Element might be loading"
    }
  ],
  "confidence": 0.8
}

Available recovery actions: RETRY_WITH_WAIT, USE_DIFFERENT_SELECTOR, FALLBACK_PROVIDER, SKIP_STEP, MANUAL_INPUT

Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Extract text from Gemini API response
   * @private
   */
  _extractTextFromResponse(result) {
    try {
      const response = result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Failed to extract text from Gemini response: ${error.message}`);
    }
  }

  /**
   * Parse plan response from Gemini
   * @private
   */
  _parsePlanResponse(response, goal) {
    try {
      // Remove markdown code blocks if present
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        steps: parsed.steps || [],
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || '',
        metadata: {
          originalGoal: goal,
          provider: 'gemini',
          model: this.modelInfo.name,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini plan response: ${error.message}`);
    }
  }

  /**
   * Parse selector response
   * @private
   */
  _parseSelectorResponse(response) {
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        selectors: parsed.selectors || [],
        reasoning: parsed.reasoning || '',
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini selector response: ${error.message}`);
    }
  }

  /**
   * Parse recovery response
   * @private
   */
  _parseRecoveryResponse(response) {
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        recoverable: parsed.recoverable !== false,
        suggestions: parsed.suggestions || [],
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini recovery response: ${error.message}`);
    }
  }

  /**
   * Estimate token count (rough approximation)
   * @private
   */
  _estimateTokens(text) {
    if (!text) return 0;
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
