/**
 * @fileoverview BaseRepository - Abstract repository interface
 * Defines standard CRUD operations for all repositories.
 * 
 * @architectural-principle Repository Pattern (abstraction over data storage)
 */

/**
 * Abstract base class for all repositories
 * Provides common interface for data persistence
 * @abstract
 */
export default class BaseRepository {
  /**
   * @param {Object} storageProvider - Storage provider instance
   */
  constructor(storageProvider) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated');
    }
    this.storage = storageProvider;
  }

  /**
   * Save an entity
   * @abstract
   * @param {Object} entity - Entity to save
   * @returns {Promise<Object>} Saved entity with ID
   */
  async save(entity) {
    throw new Error('save() must be implemented by subclass');
  }

  /**
   * Find entity by ID
   * @abstract
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Entity or null if not found
   */
  async findById(id) {
    throw new Error('findById() must be implemented by subclass');
  }

  /**
   * Find all entities
   * @abstract
   * @param {Object} [filters] - Optional filters
   * @returns {Promise<Array<Object>>} Array of entities
   */
  async findAll(filters = {}) {
    throw new Error('findAll() must be implemented by subclass');
  }

  /**
   * Update an entity
   * @abstract
   * @param {string} id - Entity ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated entity or null
   */
  async update(id, updates) {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Delete an entity
   * @abstract
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * Check if entity exists
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    const entity = await this.findById(id);
    return entity !== null;
  }

  /**
   * Count entities
   * @param {Object} [filters] - Optional filters
   * @returns {Promise<number>} Count of entities
   */
  async count(filters = {}) {
    const entities = await this.findAll(filters);
    return entities.length;
  }
}
