/**
 * @fileoverview InMemoryProvider - In-memory storage implementation
 * Simple Map-based storage for testing and temporary data.
 */

import BaseStorageProvider from './BaseStorageProvider.js';

/**
 * In-memory storage provider
 * Uses JavaScript Maps to store data temporarily
 * @extends BaseStorageProvider
 */
export default class InMemoryProvider extends BaseStorageProvider {
  constructor() {
    super();
    // Map of collection name -> Map of id -> entity
    this.collections = new Map();
  }

  /**
   * Get or create collection
   * @private
   */
  _getCollection(collectionName) {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    return this.collections.get(collectionName);
  }

  /**
   * Save entity
   * @param {string} collection - Collection name
   * @param {Object} entity - Entity to save
   * @returns {Promise<Object>} Saved entity
   */
  async save(collection, entity) {
    if (!entity.id) {
      throw new Error('Entity must have an id property');
    }

    const coll = this._getCollection(collection);
    const savedEntity = { ...entity };
    coll.set(entity.id, savedEntity);
    
    return savedEntity;
  }

  /**
   * Find by ID
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Entity or null
   */
  async findById(collection, id) {
    const coll = this._getCollection(collection);
    const entity = coll.get(id);
    
    return entity ? { ...entity } : null;
  }

  /**
   * Find all entities
   * @param {string} collection - Collection name
   * @param {Object} [filters] - Filters (simple property matching)
   * @returns {Promise<Array<Object>>} Array of entities
   */
  async findAll(collection, filters = {}) {
    const coll = this._getCollection(collection);
    let entities = Array.from(coll.values());

    // Apply filters
    if (Object.keys(filters).length > 0) {
      entities = entities.filter(entity => {
        return Object.entries(filters).every(([key, value]) => {
          return entity[key] === value;
        });
      });
    }

    return entities.map(e => ({ ...e }));
  }

  /**
   * Update entity
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated entity or null
   */
  async update(collection, id, updates) {
    const coll = this._getCollection(collection);
    const entity = coll.get(id);
    
    if (!entity) return null;

    const updated = {
      ...entity,
      ...updates,
      id // Preserve original ID
    };

    coll.set(id, updated);
    return { ...updated };
  }

  /**
   * Delete entity
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(collection, id) {
    const coll = this._getCollection(collection);
    return coll.delete(id);
  }

  /**
   * Clear collection
   * @param {string} collection - Collection name
   * @returns {Promise<void>}
   */
  async clear(collection) {
    this.collections.delete(collection);
  }

  /**
   * Get stats
   * @returns {Object} Storage statistics
   */
  getStats() {
    const stats = {};
    
    for (const [collectionName, collection] of this.collections) {
      stats[collectionName] = collection.size;
    }
    
    return {
      collections: this.collections.size,
      entities: stats,
      totalEntities: Object.values(stats).reduce((sum, count) => sum + count, 0),
    };
  }

  /**
   * Clear all data
   * @returns {Promise<void>}
   */
  async clearAll() {
    this.collections.clear();
  }
}
