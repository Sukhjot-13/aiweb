/**
 * @fileoverview BaseStorageProvider - Abstract storage interface
 * Defines storage operations that must be implemented by all providers.
 */

/**
 * Abstract base class for storage providers
 * @abstract
 */
export default class BaseStorageProvider {
  constructor() {
    if (new.target === BaseStorageProvider) {
      throw new Error('BaseStorageProvider is abstract and cannot be instantiated');
    }
  }

  /**
   * Save an entity to a collection
   * @abstract
   * @param {string} collection - Collection/table name
   * @param {Object} entity - Entity to save (must have id property)
   * @returns {Promise<Object>} Saved entity
   */
  async save(collection, entity) {
    throw new Error('save() must be implemented by subclass');
  }

  /**
   * Find entity by ID
   * @abstract
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Entity or null
   */
  async findById(collection, id) {
    throw new Error('findById() must be implemented by subclass');
  }

  /**
   * Find all entities in collection
   * @abstract
   * @param {string} collection - Collection name
   * @param {Object} [filters] - Optional filters
   * @returns {Promise<Array<Object>>} Array of entities
   */
  async findAll(collection, filters = {}) {
    throw new Error('findAll() must be implemented by subclass');
  }

  /**
   * Update an entity
   * @abstract
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated entity or null
   */
  async update(collection, id, updates) {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Delete an entity
   * @abstract
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(collection, id) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * Clear all data in a collection
   * @abstract
   * @param {string} collection - Collection name
   * @returns {Promise<void>}
   */
  async clear(collection) {
    throw new Error('clear() must be implemented by subclass');
  }
}
