/**
 * @fileoverview Centralized AI Configuration
 * 
 * **CRITICAL: SINGLE POINT OF CONFIGURATION**
 * 
 * To change AI provider: Set env AI_PROVIDER=gemini|openai|mock
 * To change Gemini model: Set env GEMINI_MODEL=gemini-pro|gemini-flash-latest
 * 
 * All AI-related configuration is managed here. No other file should read
 * AI environment variables directly.
 * 
 * @architectural-principle One Change, One Place
 */

/**
 * AI Provider Types
 * @enum {string}
 */
export const AIProviderType = {
  MOCK: 'mock',
  GEMINI: 'gemini',
  OPENAI: 'openai', // Future
};

/**
 * Gemini Models
 * @enum {string}
 */
export const GeminiModel = {
  FLASH: 'gemini-flash-latest',
  PRO: 'gemini-pro',
  PRO_VISION: 'gemini-pro-vision',
};

/**
 * AI Configuration
 */
export class AIConfig {
  /**
   * Get current AI provider type from environment
   * @returns {string} Provider type (mock, gemini, openai)
   */
  static getProviderType() {
    return process.env.AI_PROVIDER || AIProviderType.MOCK;
  }

  /**
   * Get Gemini API key
   * @returns {string|undefined} API key
   */
  static getGeminiApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Get Gemini model name
   * @returns {string} Model name
   */
  static getGeminiModel() {
    return process.env.GEMINI_MODEL || GeminiModel.FLASH;
  }

  /**
   * Get OpenAI API key (future)
   * @returns {string|undefined} API key
   */
  static getOpenAIApiKey() {
    return process.env.OPENAI_API_KEY;
  }

  /**
   * Get OpenAI model name (future)
   * @returns {string} Model name
   */
  static getOpenAIModel() {
    return process.env.OPENAI_MODEL || 'gpt-4';
  }

  /**
   * Get generation parameters for Gemini
   * @returns {Object} Generation config
   */
  static getGeminiGenerationConfig() {
    return {
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      topK: parseInt(process.env.AI_TOP_K || '40', 10),
      topP: parseFloat(process.env.AI_TOP_P || '0.95'),
      maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '8192', 10),
    };
  }

  /**
   * Get rate limiting configuration
   * @returns {Object} Rate limit config
   */
  static getRateLimitConfig() {
    return {
      maxRequestsPerMinute: parseInt(process.env.AI_MAX_REQUESTS_PER_MIN || '60', 10),
      maxTokensPerMinute: parseInt(process.env.AI_MAX_TOKENS_PER_MIN || '1000000', 10),
    };
  }

  /**
   * Get retry configuration
   * @returns {Object} Retry config
   */
  static getRetryConfig() {
    return {
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
      initialDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || '1000', 10),
      maxDelayMs: parseInt(process.env.AI_MAX_RETRY_DELAY_MS || '10000', 10),
      backoffMultiplier: parseFloat(process.env.AI_BACKOFF_MULTIPLIER || '2.0'),
    };
  }

  /**
   * Get complete AI configuration
   * @returns {Object} Full AI config
   */
  static getConfig() {
    return {
      provider: this.getProviderType(),
      gemini: {
        apiKey: this.getGeminiApiKey(),
        model: this.getGeminiModel(),
        generationConfig: this.getGeminiGenerationConfig(),
      },
      openai: {
        apiKey: this.getOpenAIApiKey(),
        model: this.getOpenAIModel(),
      },
      rateLimit: this.getRateLimitConfig(),
      retry: this.getRetryConfig(),
    };
  }

  /**
   * Validate configuration for current provider
   * @throws {Error} If configuration is invalid
   */
  static validate() {
    const provider = this.getProviderType();

    if (provider === AIProviderType.GEMINI) {
      const apiKey = this.getGeminiApiKey();
      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY environment variable is required when AI_PROVIDER=gemini'
        );
      }
    }

    if (provider === AIProviderType.OPENAI) {
      const apiKey = this.getOpenAIApiKey();
      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY environment variable is required when AI_PROVIDER=openai'
        );
      }
    }
  }

  /**
   * Check if using production AI (not mock)
   * @returns {boolean}
   */
  static isProductionAI() {
    return this.getProviderType() !== AIProviderType.MOCK;
  }
}

/**
 * Convenience function to get AI configuration
 * @returns {Object} AI configuration
 */
export function getAIConfig() {
  return AIConfig.getConfig();
}

export default AIConfig;
