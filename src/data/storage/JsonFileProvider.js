/**
 * @fileoverview JsonFileProvider - File-based storage implementation
 * Stores data as JSON files for temporary persistence across restarts.
 */

import BaseStorageProvider from './BaseStorageProvider.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * JSON file storage provider
 * Stores collections as separate JSON files
 * @extends BaseStorageProvider
 */
export default class JsonFileProvider extends BaseStorageProvider {
  /**
   * @param {Object} [options] - Provider options
   * @param {string} [options.basePath] - Base directory for storage (.temp/tasks by default)
   */
  constructor(options = {}) {
    super();
    this.basePath = options.basePath || path.join(process.cwd(), '.temp', 'tasks');
    this.cache = new Map(); // In-memory cache for performance
  }

  /**
   * Ensure storage directory exists
   * @private
   */
  async _ensureDirectory() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  /**
   * Get file path for collection
   * @private
   */
  _getFilePath(collection) {
    return path.join(this.basePath, `${collection}.json`);
  }

  /**
   * Load collection from file
   * @private
   */
  async _loadCollection(collection) {
    // Check cache first
    if (this.cache.has(collection)) {
      return this.cache.get(collection);
    }

    const filePath = this._getFilePath(collection);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache.set(collection, parsed);
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty collection
        const empty = {};
        this.cache.set(collection, empty);
        return empty;
      }
      throw error;
    }
  }

  /**
   * Save collection to file
   * @private
   */
  async _saveCollection(collection, data) {
    await this._ensureDirectory();
    const filePath = this._getFilePath(collection);
    
    // Update cache
    this.cache.set(collection, data);
    
    // Write to file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
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

    const data = await this._loadCollection(collection);
    data[entity.id] = { ...entity };
    await this._saveCollection(collection, data);
    
    return { ...entity };
  }

  /**
   * Find by ID
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Entity or null
   */
  async findById(collection, id) {
    const data = await this._loadCollection(collection);
    const entity = data[id];
    
    return entity ? { ...entity } : null;
  }

  /**
   * Find all entities
   * @param {string} collection - Collection name
   * @param {Object} [filters] - Filters
   * @returns {Promise<Array<Object>>} Array of entities
   */
  async findAll(collection, filters = {}) {
    const data = await this._loadCollection(collection);
    let entities = Object.values(data);

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
    const data = await this._loadCollection(collection);
    
    if (!data[id]) return null;

    const updated = {
      ...data[id],
      ...updates,
      id // Preserve original ID
    };

    data[id] = updated;
    await this._saveCollection(collection, data);
    
    return { ...updated };
  }

  /**
   * Delete entity
   * @param {string} collection - Collection name
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(collection, id) {
    const data = await this._loadCollection(collection);
    
    if (!data[id]) return false;

    delete data[id];
    await this._saveCollection(collection, data);
    
    return true;
  }

  /**
   * Clear collection
   * @param {string} collection - Collection name
   * @returns {Promise<void>}
   */
  async clear(collection) {
    await this._saveCollection(collection, {});
    const filePath = this._getFilePath(collection);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage stats
   */
  async getStats() {
    await this._ensureDirectory();
    const files = await fs.readdir(this.basePath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const stats = {};
    for (const file of jsonFiles) {
      const collection = file.replace('.json', '');
      const data = await this._loadCollection(collection);
      stats[collection] = Object.keys(data).length;
    }

    return {
      collections: jsonFiles.length,
      entities: stats,
      totalEntities: Object.values(stats).reduce((sum, count) => sum + count, 0),
      storageLocation: this.basePath,
    };
  }

  /**
   * Clear all data
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      const files = await fs.readdir(this.basePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.basePath, file));
        }
      }
      
      this.cache.clear();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}
