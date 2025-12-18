/**
 * @fileoverview AI Provider Factory
 * 
 * **CRITICAL: SINGLE POINT FOR AI PROVIDER SELECTION**
 * 
 * To change AI provider: Set AI_PROVIDER environment variable
 *  - AI_PROVIDER=mock → MockAIProvider (no API key needed)
 *  - AI_PROVIDER=gemini → GeminiAIProvider (needs GEMINI_API_KEY)
 *  - AI_PROVIDER=openai → OpenAIProvider (future, needs OPENAI_API_KEY)
 * 
 * @architectural-principle Factory Pattern, Dependency Inversion
 */

import AIConfig, { AIProviderType } from '../config/aiConfig.js';
import MockAIProvider from './MockAIProvider.js';
import GeminiAIProvider from './GeminiAIProvider.js';

/**
 * Cached provider instance (singleton per provider type)
 * @type {Map<string, BaseAIProvider>}
 */
const providerCache = new Map();

/**
 * Get AI provider based on configuration
 * 
 * This is the PRIMARY method to get AI provider in application code.
 * 
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.provider] - Override provider type
 * @param {boolean} [options.forceNew=false] - Force new instance (ignore cache)
 * @returns {BaseAIProvider} Configured AI provider
 * @throws {Error} If provider type is invalid or configuration is missing
 * 
 * @example
 * // Get default provider from env
 * const aiProvider = getAIProvider();
 * 
 * @example
 * // Force mock for testing
 * const mockProvider = getAIProvider({ provider: 'mock' });
 */
export function getAIProvider(options = {}) {
  const providerType = options.provider || AIConfig.getProviderType();

  // Return cached instance if available
  if (!options.forceNew && providerCache.has(providerType)) {
    return providerCache.get(providerType);
  }

  // Create new provider based on type
  let provider;

  switch (providerType) {
    case AIProviderType.MOCK:
      provider = new MockAIProvider();
      break;

    case AIProviderType.GEMINI:
      // Validate configuration
      AIConfig.validate();
      provider = new GeminiAIProvider();
      break;

    case AIProviderType.OPENAI:
      throw new Error('OpenAI provider not yet implemented. Use mock or gemini.');

    default:
      throw new Error(
        `Invalid AI provider type: ${providerType}. Valid options: ${Object.values(AIProviderType).join(', ')}`
      );
  }

  // Cache provider
  providerCache.set(providerType, provider);

  return provider;
}

/**
 * Clear provider cache (useful for testing or configuration changes)
 */
export function clearProviderCache() {
  providerCache.clear();
}

/**
 * Get current provider information
 * 
 * @returns {Object} Provider info
 */
export function getProviderInfo() {
  const providerType = AIConfig.getProviderType();
  const config = AIConfig.getConfig();

  return {
    type: providerType,
    isProduction: AIConfig.isProductionAI(),
    activeProvider: providerCache.has(providerType) ? 'cached' : 'new',
    config: {
      gemini: {
        model: config.gemini.model,
        hasApiKey: !!config.gemini.apiKey,
      },
      openai: {
        model: config.openai.model,
        hasApiKey: !!config.openai.apiKey,
      },
    },
  };
}

/**
 * Create specific provider (bypass factory logic)
 * Useful for testing or when you need multiple provider instances
 * 
 * @param {string} providerType - Provider type
 * @param {Object} [config] - Provider configuration
 * @returns {BaseAIProvider} Provider instance
 */
export function createProvider(providerType, config = {}) {
  switch (providerType) {
    case AIProviderType.MOCK:
      return new MockAIProvider();

    case AIProviderType.GEMINI:
      return new GeminiAIProvider();

    case AIProviderType.OPENAI:
      throw new Error('OpenAI provider not yet implemented');

    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}

export default {
  getAIProvider,
  clearProviderCache,
  getProviderInfo,
  createProvider,
  AIProviderType,
};
