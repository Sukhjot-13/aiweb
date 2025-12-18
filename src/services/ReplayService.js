/**
 * @fileoverview ReplayService - Task replay service
 * Enables replaying saved tasks from any point in execution.
 */

import TaskPersistenceService from './TaskPersistenceService.js';
import { TaskExecutor } from './TaskExecutor.js';
import { ProgressEventType } from '../models/ProgressEvent.js';

/**
 * Task replay service
 * Re-executes saved tasks with original or modified parameters
 */
export default class ReplayService {
  constructor(options = {}) {
    this.persistenceService = options.persistenceService || new TaskPersistenceService();
    this.executor = options.executor || new TaskExecutor();
  }

  /**
   * Replay a task from the beginning
   * @param {string} taskId - Task ID to replay
   * @param {Object} [options] - Replay options
   * @param {boolean} [options.skipCompleted=true] - Skip already completed steps
   * @param {Function} [options.onProgress] - Progress callback
   * @returns {Promise<Object>} Replay result
   */
  async replayTask(taskId, options = {}) {
    const checkpoint = await this.persistenceService.restoreCheckpoint(taskId);
    
    if (!checkpoint) {
      throw new Error(`Task ${taskId} not found`);
    }

    const { task, history } = checkpoint;

    // Emit replay started event
    if (options.onProgress) {
      options.onProgress({
        type: ProgressEventType.REPLAY_STARTED,
        data: {
          taskId,
          originallyCreatedAt: task.metadata.createdAt,
          replayStartedAt: new Date().toISOString(),
        },
      });
    }

    // Determine starting point
    let startIndex = 0;
    if (options.skipCompleted) {
      startIndex = task.currentStepIndex;
    }

    // Replay execution
    const result = await this._executeFromStep(task, startIndex, options);

    // Save updated task state
    await this.persistenceService.saveTask(task);

    return {
      taskId,
      result,
      replayed: true,
      originalCreatedAt: task.metadata.createdAt,
      replayedAt: new Date().toISOString(),
    };
  }

  /**
   * Replay from a specific step
   * @param {string} taskId - Task ID
   * @param {number} stepIndex - Step index to start from
   * @param {Object} [options] - Replay options
   * @returns {Promise<Object>} Replay result
   */
  async replayFromStep(taskId, stepIndex, options = {}) {
    const checkpoint = await this.persistenceService.restoreCheckpoint(taskId);
    
    if (!checkpoint) {
      throw new Error(`Task ${taskId} not found`);
    }

    const { task } = checkpoint;

    if (stepIndex >= task.steps.length) {
      throw new Error(`Step index ${stepIndex} out of range (max: ${task.steps.length - 1})`);
    }

    // Reset task state to specified step
    task.currentStepIndex = stepIndex;

    // Emit replay event
    if (options.onProgress) {
      options.onProgress({
        type: ProgressEventType.REPLAY_STARTED,
        data: {
          taskId,
          startingFromStep: stepIndex,
          replayStartedAt: new Date().toISOString(),
        },
      });
    }

    // Replay from step
    const result = await this._executeFromStep(task, stepIndex, options);

    // Save updated state
    await this.persistenceService.saveTask(task);

    return {
      taskId,
      result,
      replayed: true,
      replayedFromStep: stepIndex,
      replayedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute task from specific step
   * @private
   */
  async _executeFromStep(task, startIndex, options) {
    // Set up progress tracking
    if (options.onProgress) {
      this.executor.on('*', (event) => {
        options.onProgress(event);
      });
    }

    // Execute task
    const result = await this.executor.executeTask(task, {
      startFromStep: startIndex,
    });

    return result;
  }

  /**
   * Compare two task executions
   * @param {string} taskId1 - First task ID
   * @param {string} taskId2 - Second task ID
   * @returns {Promise<Object>} Comparison results
   */
  async compareTasks(taskId1, taskId2) {
    const task1 = await this.persistenceService.loadTask(taskId1);
    const task2 = await this.persistenceService.loadTask(taskId2);

    if (!task1 || !task2) {
      throw new Error('One or both tasks not found');
    }

    const history1 = await this.persistenceService.getTaskHistory(taskId1);
    const history2 = await this.persistenceService.getTaskHistory(taskId2);

    return {
      task1: {
        id: task1.id,
        goal: task1.goal,
        status: task1.status,
        steps: task1.steps.length,
        completed: task1.executionMetadata.completedSteps,
        duration: task1.executionMetadata.duration,
        historyEntries: history1.length,
      },
      task2: {
        id: task2.id,
        goal: task2.goal,
        status: task2.status,
        steps: task2.steps.length,
        completed: task2.executionMetadata.completedSteps,
        duration: task2.executionMetadata.duration,
        historyEntries: history2.length,
      },
      differences: {
        sameGoal: task1.goal === task2.goal,
        sameTotalSteps: task1.steps.length === task2.steps.length,
        sameStatus: task1.status === task2.status,
        durationDiff: Math.abs(
          (task1.executionMetadata.duration || 0) - (task2.executionMetadata.duration || 0)
        ),
      },
    };
  }

  /**
   * Get replay capabilities for a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Replay capabilities
   */
  async getReplayCapabilities(taskId) {
    const checkpoint = await this.persistenceService.restoreCheckpoint(taskId);
    
    if (!checkpoint) {
      return {
        canReplay: false,
        reason: 'Task not found',
      };
    }

    const { task, history } = checkpoint;

    return {
      canReplay: true,
      taskId: task.id,
      goal: task.goal,
      status: task.status,
      totalSteps: task.steps.length,
      completedSteps: task.executionMetadata.completedSteps,
      currentStep: task.currentStepIndex,
      canReplayFrom: task.currentStepIndex,
      historyEntries: history.length,
      lastUpdated: task.metadata.updatedAt,
    };
  }
}
