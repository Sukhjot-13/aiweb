/**
 * @fileoverview ProviderFactory - Storage provider factory
 * Creates appropriate storage provider based on configuration.
 */

import InMemoryProvider from './InMemoryProvider.js';
import JsonFileProvider from './JsonFileProvider.js';

/**
 * Storage provider types
 */
export const ProviderType = Object.freeze({
  MEMORY: 'memory',
  JSON: 'json',
  // Future: MONGODB: 'mongodb', POSTGRES: 'postgres'
});

/**
 * Storage provider factory
 * Singleton that manages storage provider instances
 */
class StorageProviderFactory {
  constructor() {
    this.instances = new Map();
  }

  /**
   * Get storage provider instance
   * @param {string} [type] - Provider type (defaults to env or 'memory')
   * @param {Object} [options] - Provider options
   * @returns {BaseStorageProvider} Storage provider instance
   */
  getProvider(type = null, options = {}) {
    // Determine provider type
    const providerType = type || process.env.STORAGE_PROVIDER || ProviderType.MEMORY;

    // Return cached instance if exists
    const cacheKey = `${providerType}_${JSON.stringify(options)}`;
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey);
    }

    // Create new provider
    let provider;
    
    switch (providerType.toLowerCase()) {
      case Provider Type.MEMORY:
        provider = new InMemoryProvider();
        break;
      
      case ProviderType.JSON:
        provider = new JsonFileProvider(options);
        break;
      
      default:
        throw new Error(`Unknown storage provider type: ${providerType}`);
    }

    // Cache and return
    this.instances.set(cacheKey, provider);
    return provider;
  }

  /**
   * Clear cached instances
   */
  clearCache() {
    this.instances.clear();
  }

  /**
   * Get current provider type from env
   * @returns {string} Provider type
   */
  getCurrentProviderType() {
    return process.env.STORAGE_PROVIDER || ProviderType.MEMORY;
  }
}

// Export singleton instance
export default new StorageProviderFactory();
