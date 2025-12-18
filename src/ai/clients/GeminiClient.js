/**
 * @fileoverview Gemini Client Factory
 * 
 * **CRITICAL: SINGLE POINT OF GEMINI SDK INITIALIZATION**
 * 
 * This file is the ONLY place where Gemini SDK is initialized.
 * All other code should use getGeminiClient() to get a configured client.
 * 
 * To change model: Update GEMINI_MODEL environment variable in .env
 * 
 * @architectural-principle Dependency Inversion, Single Responsibility
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import AIConfig from '../../config/aiConfig.js';

/**
 * Singleton Gemini client instance
 * @type {GoogleGenerativeAI|null}
 */
let geminiClientInstance = null;

/**
 * Cached generative model instance
 * @type {Object|null}
 */
let cachedModel = null;

/**
 * Last used model name (for cache invalidation)
 * @type {string|null}
 */
let lastModelName = null;

/**
 * Get or create Gemini SDK client (singleton)
 * 
 * @returns {GoogleGenerativeAI} Configured Gemini client
 * @throws {Error} If API key is missing
 */
export function getGeminiClient() {
  if (!geminiClientInstance) {
    const apiKey = AIConfig.getGeminiApiKey();
    
    if (!apiKey) {
      throw new Error(
        'Gemini API key is required. Set GEMINI_API_KEY environment variable.'
      );
    }

    geminiClientInstance = new GoogleGenerativeAI(apiKey);
  }

  return geminiClientInstance;
}

/**
 * Get configured generative model
 * 
 * This is the PRIMARY method to use in application code.
 * 
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.model] - Override model name
 * @param {Object} [options.generationConfig] - Override generation config
 * @param {Object} [options.safetySettings] - Safety settings
 * @returns {Object} Generative model instance
 * 
 * @example
 * const model = getGenerativeModel();
 * const result = await model.generateContent(prompt);
 */
export function getGenerativeModel(options = {}) {
  const client = getGeminiClient();
  
  // Get configuration from centralized config
  const config = AIConfig.getConfig();
  const modelName = options.model || config.gemini.model;
  const generationConfig = options.generationConfig || config.gemini.generationConfig;

  // Cache invalidation: if model changed, recreate
  if (cachedModel && lastModelName === modelName) {
    return cachedModel;
  }

  // Create model with configuration
  cachedModel = client.getGenerativeModel({
    model: modelName,
    generationConfig,
    safetySettings: options.safetySettings || getDefaultSafetySettings(),
  });

  lastModelName = modelName;

  return cachedModel;
}

/**
 * Get default safety settings for Gemini
 * 
 * @returns {Array<Object>} Safety settings
 */
function getDefaultSafetySettings() {
  return [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ];
}

/**
 * Generate content with retry logic
 * 
 * @param {string} prompt - Text prompt
 * @param {Object} [options] - Generation options
 * @returns {Promise<Object>} Generation result
 */
export async function generateContent(prompt, options = {}) {
  const model = getGenerativeModel(options);
  const retryConfig = AIConfig.getRetryConfig();

  let lastError;
  let delay = retryConfig.initialDelayMs;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      // Last attempt, throw error
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Wait before retry
      await sleep(delay);
      delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs);
    }
  }

  throw new Error(
    `Gemini API failed after ${retryConfig.maxRetries} retries: ${lastError.message}`
  );
}

/**
 * Check if error should not be retried
 * 
 * @param {Error} error - Error object
 * @returns {boolean} True if non-retryable
 */
function isNonRetryableError(error) {
  const message = error.message?.toLowerCase() || '';
  
  // API key errors
  if (message.includes('api key') || message.includes('unauthorized')) {
    return true;
  }

  // Invalid request errors
  if (message.includes('invalid') || message.includes('bad request')) {
    return true;
  }

  return false;
}

/**
 * Sleep utility
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset client (for testing or configuration changes)
 */
export function resetClient() {
  geminiClientInstance = null;
  cachedModel = null;
  lastModelName = null;
}

/**
 * Get current model information
 * 
 * @returns {Object} Model info
 */
export function getModelInfo() {
  return {
    modelName: AIConfig.getGeminiModel(),
    hasClient: geminiClientInstance !== null,
    hasCache: cachedModel !== null,
  };
}

export default {
  getGeminiClient,
  getGenerativeModel,
  generateContent,
  resetClient,
  getModelInfo,
};
