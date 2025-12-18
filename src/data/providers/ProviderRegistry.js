/**
 * @fileoverview ProviderRegistry - Central provider registration and management
 * Implements singleton pattern for managing all automation providers.
 */

const { StrategyType } = require('../../models/AutomationStrategy');

/**
 * ProviderRegistry class
 * Central registry for all automation providers
 * @class
 */
class ProviderRegistry {
  constructor() {
    if (ProviderRegistry.instance) {
      return ProviderRegistry.instance;
    }

    this.providers = new Map();
    this.strategyProviderMap = new Map();
    
    ProviderRegistry.instance = this;
  }

  /**
   * Registers a provider
   * @param {BaseProvider} provider - Provider to register
   * @param {string} strategyType - Strategy type this provider handles
   * @throws {Error} If provider is invalid
   */
  register(provider, strategyType) {
    if (!provider || !provider.getName) {
      throw new Error('Invalid provider: must have getName() method');
    }

    if (!Object.values(StrategyType).includes(strategyType)) {
      throw new Error(`Invalid strategy type: ${strategyType}`);
    }

    const providerName = provider.getName();
    
    this.providers.set(providerName, provider);
    this.strategyProviderMap.set(strategyType, provider);
  }

  /**
   * Gets provider by strategy type
   * @param {string} strategyType - Strategy type
   * @returns {BaseProvider|null} Provider or null if not found
   */
  getProvider(strategyType) {
    return this.strategyProviderMap.get(strategyType) || null;
  }

  /**
   * Gets provider by name
   * @param {string} providerName - Provider name
   * @returns {BaseProvider|null} Provider or null if not found
   */
  getProviderByName(providerName) {
    return this.providers.get(providerName) || null;
  }

  /**
   * Gets all registered providers
   * @returns {Array<BaseProvider>} Array of all providers
   */
  getAllProviders() {
    return Array.from(this.providers.values());
  }

  /**
   * Checks health of all providers
   * @returns {Promise<Object>} Health status of all providers
   */
  async checkAllHealth() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck();
    }

    return results;
  }

  /**
   * Unregisters a provider
   * @param {string} providerName - Provider name to unregister
   * @returns {boolean} True if provider was found and unregistered
   */
  unregister(providerName) {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      return false;
    }

    // Remove from both maps
    this.providers.delete(providerName);
    
    // Find and remove from strategy map
    for (const [strategy, prov] of this.strategyProviderMap) {
      if (prov.getName() === providerName) {
        this.strategyProviderMap.delete(strategy);
      }
    }

    return true;
  }

  /**
   * Clears all registered providers
   */
  clear() {
    this.providers.clear();
    this.strategyProviderMap.clear();
  }

  /**
   * Gets singleton instance
   * @returns {ProviderRegistry} Registry instance
   */
  static getInstance() {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }
}

module.exports = { ProviderRegistry };
