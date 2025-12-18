/**
 * @fileoverview TaskPersistenceService - Task persistence service
 * Handles automatic saving and loading of task state during execution.
 */

import TaskRepository from '../data/repositories/TaskRepository.js';
import ExecutionHistoryRepository from '../data/repositories/ExecutionHistoryRepository.js';
import StorageProviderFactory from '../data/storage/ProviderFactory.js';

/**
 * Task persistence service
 * Automatically persists task state and execution history
 */
export default class TaskPersistenceService {
  constructor(options = {}) {
    const storageProvider = StorageProviderFactory.getProvider(
      options.storageType,
      options.storageOptions
    );
    
    this.taskRepository = new TaskRepository(storageProvider);
    this.historyRepository = new ExecutionHistoryRepository(storageProvider);
    this.autoSaveEnabled = options.autoSave !== false; // Default: true
  }

  /**
   * Save task state
   * @param {Task} task - Task to save
   * @returns {Promise<Task>} Saved task
   */
  async saveTask(task) {
    return await this.taskRepository.save(task);
  }

  /**
   * Load task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Task|null>} Task or null
   */
  async loadTask(taskId) {
    return await this.taskRepository.findById(taskId);
  }

  /**
   * Save execution event
   * @param {string} taskId - Task ID
   * @param {Object} event - Event data
   * @returns {Promise<Object>} Saved event
   */
  async saveExecutionEvent(taskId, event) {
    return await this.historyRepository.save({
      taskId,
      type: 'event',
      data: event,
    });
  }

  /**
   * Save step result
   * @param {string} taskId - Task ID
   * @param {number} stepIndex - Step index
   * @param {Object} result - Step result
   * @returns {Promise<Object>} Saved result
   */
  async saveStepResult(taskId, stepIndex, result) {
    return await this.historyRepository.save({
      taskId,
      type: 'step_result',
      data: {
        stepIndex,
        result,
      },
    });
  }

  /**
   * Get task execution history
   * @param {string} taskId - Task ID
   * @returns {Promise<Array<Object>>} History entries
   */
  async getTaskHistory(taskId) {
    return await this.historyRepository.findByTaskId(taskId);
  }

  /**
   * Get task execution timeline
   * @param {string} taskId - Task ID
   * @returns {Promise<Array<Object>>} Timeline entries
   */
  async getTimeline(taskId) {
    return await this.historyRepository.getTimeline(taskId);
  }

  /**
   * List all saved tasks
   * @param {Object} [filters] - Filters
   * @returns {Promise<Array<Task>>} Tasks
   */
  async listTasks(filters = {}) {
    return await this.taskRepository.findAll(filters);
  }

  /**
   * List recent tasks
   * @param {number} [limit=10] - Max tasks
   * @returns {Promise<Array<Task>>} Recent tasks
   */
  async listRecentTasks(limit = 10) {
    return await this.taskRepository.findRecent(limit);
  }

  /**
   * Search tasks by goal
   * @param {string} query - Search query
   * @returns {Promise<Array<Task>>} Matching tasks
   */
  async searchTasks(query) {
    return await this.taskRepository.searchByGoal(query);
  }

  /**
   * Delete task and its history
   * @param {string} taskId - Task ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteTask(taskId) {
    // Delete history first
    await this.historyRepository.deleteByTaskId(taskId);
    
    // Then delete task
    return await this.taskRepository.delete(taskId);
  }

  /**
   * Auto-save task state on update
   * Designed to be called during task execution
   * @param {Task} task - Task to save
   * @returns {Promise<Task>} Saved task
   */
  async onTaskUpdate(task) {
    if (!this.autoSaveEnabled) return task;
    
    return await this.saveTask(task);
  }

  /**
   * Auto-save on progress event
   * @param {string} taskId - Task ID
   * @param {Object} event - Progress event
   * @returns {Promise<Object>} Saved event
   */
  async onProgressEvent(taskId, event) {
    if (!this.autoSaveEnabled) return event;
    
    return await this.saveExecutionEvent(taskId, event);
  }

  /**
   * Create checkpoint
   * Saves complete task state including all history
   * @param {Task} task - Task to checkpoint
   * @returns {Promise<Object>} Checkpoint data
   */
  async createCheckpoint(task) {
    const savedTask = await this.saveTask(task);
    const history = await this.getTaskHistory(task.id);
    
    return {
      task: savedTask,
      history,
      checkpointedAt: new Date().toISOString(),
    };
  }

  /**
   * Restore from checkpoint
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Restored checkpoint
   */
  async restoreCheckpoint(taskId) {
    const task = await this.loadTask(taskId);
    if (!task) return null;
    
    const history = await this.getTaskHistory(taskId);
    
    return {
      task,
      history,
      restoredAt: new Date().toISOString(),
    };
  }
}
