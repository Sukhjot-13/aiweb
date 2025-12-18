/**
 * @fileoverview TaskRepository - Repository for Task entities
 * Handles persistence and retrieval of Task instances.
 */

import BaseRepository from './BaseRepository.js';
import { Task } from '../../models/Task.js';

/**
 * Repository for Task entities
 * @extends BaseRepository
 */
export default class TaskRepository extends BaseRepository {
  constructor(storageProvider) {
    super(storageProvider);
    this.collectionName = 'tasks';
  }

  /**
   * Save a task
   * @param {Task} task - Task instance to save
   * @returns {Promise<Task>} Saved task
   */
  async save(task) {
    if (!(task instanceof Task)) {
      throw new Error('Entity must be a Task instance');
    }

    const taskData = task.toJSON();
    const saved = await this.storage.save(this.collectionName, taskData);
    
    return Task.fromJSON(saved);
  }

  /**
   * Find task by ID
   * @param {string} id - Task ID
   * @returns {Promise<Task|null>} Task instance or null
   */
  async findById(id) {
    const taskData = await this.storage.findById(this.collectionName, id);
    
    if (!taskData) return null;
    
    return Task.fromJSON(taskData);
  }

  /**
   * Find all tasks
   * @param {Object} [filters] - Filters
   * @param {string} [filters.status] - Filter by status
   * @param {Date} [filters.createdAfter] - Created after date
   * @param {Date} [filters.createdBefore] - Created before date
   * @returns {Promise<Array<Task>>} Array of tasks
   */
  async findAll(filters = {}) {
    const tasksData = await this.storage.findAll(this.collectionName, filters);
    
    return tasksData.map(data => Task.fromJSON(data));
  }

  /**
   * Update a task
   * @param {string} id - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Task|null>} Updated task
   */
  async update(id, updates) {
    const updated = await this.storage.update(this.collectionName, id, updates);
    
    if (!updated) return null;
    
    return Task.fromJSON(updated);
  }

  /**
   * Delete a task
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    return await this.storage.delete(this.collectionName, id);
  }

  /**
   * Find tasks by status
   * @param {string} status - Task status
   * @returns {Promise<Array<Task>>} Matching tasks
   */
  async findByStatus(status) {
    return this.findAll({ status });
  }

  /**
   * Find recent tasks
   * @param {number} limit - Max number of tasks
   * @returns {Promise<Array<Task>>} Recent tasks
   */
  async findRecent(limit = 10) {
    const allTasks = await this.findAll();
    
    return allTasks
      .sort((a, b) => {
        const dateA = new Date(a.metadata.createdAt);
        const dateB = new Date(b.metadata.createdAt);
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  /**
   * Find tasks by goal (fuzzy match)
   * @param {string} goalQuery - Search query
   * @returns {Promise<Array<Task>>} Matching tasks
   */
  async searchByGoal(goalQuery) {
    const allTasks = await this.findAll();
    const query = goalQuery.toLowerCase();
    
    return allTasks.filter(task => 
      task.goal.toLowerCase().includes(query)
    );
  }
}
