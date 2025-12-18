/**
 * @fileoverview ExecutionHistoryRepository - Repository for execution history
 * Stores execution events, logs, and step results.
 */

import BaseRepository from './BaseRepository.js';

/**
 * Repository for execution history entries
 * @extends BaseRepository
 */
export default class ExecutionHistoryRepository extends BaseRepository {
  constructor(storageProvider) {
    super(storageProvider);
    this.collectionName = 'execution_history';
  }

  /**
   * Save execution history entry
   * @param {Object} entry - History entry
   * @param {string} entry.taskId - Related task ID
   * @param {string} entry.type - Entry type (event, log, result)
   * @param {Object} entry.data - Entry data
   * @returns {Promise<Object>} Saved entry
   */
  async save(entry) {
    if (!entry.taskId) {
      throw new Error('History entry must have taskId');
    }

    const historyEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    return await this.storage.save(this.collectionName, historyEntry);
  }

  /**
   * Find entry by ID
   * @param {string} id - Entry ID
   * @returns {Promise<Object|null>} History entry or null
   */
  async findById(id) {
    return await this.storage.findById(this.collectionName, id);
  }

  /**
   * Find all entries
   * @param {Object} [filters] - Filters
   * @returns {Promise<Array<Object>>} History entries
   */
  async findAll(filters = {}) {
    return await this.storage.findAll(this.collectionName, filters);
  }

  /**
   * Update entry
   * @param {string} id - Entry ID
   * @param {Object} updates - Updates
   * @returns {Promise<Object|null>} Updated entry
   */
  async update(id, updates) {
    return await this.storage.update(this.collectionName, id, updates);
  }

  /**
   * Delete entry
   * @param {string} id - Entry ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    return await this.storage.delete(this.collectionName, id);
  }

  /**
   * Find history entries for a task
   * @param {string} taskId - Task ID
   * @param {Object} [options] - Options
   * @param {string} [options.type] - Filter by entry type
   * @param {number} [options.limit] - Max entries
   * @returns {Promise<Array<Object>>} History entries
   */
  async findByTaskId(taskId, options = {}) {
    const allEntries = await this.findAll({ taskId });
    
    let filtered = allEntries;
    
    // Filter by type if specified
    if (options.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp);
      const timeB = new Date(b.timestamp);
      return timeA - timeB;
    });
    
    // Limit results if specified
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  /**
   * Find entries by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} [filters] - Additional filters
   * @returns {Promise<Array<Object>>} Matching entries
   */
  async queryByDateRange(startDate, endDate, filters = {}) {
    const allEntries = await this.findAll(filters);
    
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Delete all history for a task
   * @param {string} taskId - Task ID
   * @returns {Promise<number>} Number of entries deleted
   */
  async deleteByTaskId(taskId) {
    const entries = await this.findByTaskId(taskId);
    let deletedCount = 0;
    
    for (const entry of entries) {
      const deleted = await this.delete(entry.id);
      if (deleted) deletedCount++;
    }
    
    return deletedCount;
  }

  /**
   * Get execution timeline for a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Array<Object>>} Timeline entries sorted by time
   */
  async getTimeline(taskId) {
    return this.findByTaskId(taskId);
  }
}
