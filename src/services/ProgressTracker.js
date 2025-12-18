/**
 * @fileoverview ProgressTracker - Real-time task progress tracking
 * Tracks task execution progress and emits progress events.
 */

const { EventEmitter } = require('../utils/EventEmitter');
const { ProgressEvent, ProgressEventType } = require('../models/ProgressEvent');

/**
 * ProgressTracker class
 * Tracks and reports task execution progress
 * @class
 */
class ProgressTracker {
  /**
   * @param {Object} [config] - Tracker configuration
   * @param {EventEmitter} [config.eventEmitter] - Event emitter instance
   */
  constructor(config = {}) {
    this.eventEmitter = config.eventEmitter || new EventEmitter();
    this.taskProgress = new Map();
  }

  /**
   * Starts tracking a task
   * @param {string} taskId - Task ID
   * @param {Object} taskInfo - Task information
   */
  startTask(taskId, taskInfo = {}) {
    const progress = {
      taskId,
      goal: taskInfo.goal || '',
      totalSteps: taskInfo.totalSteps || 0,
      completedSteps: 0,
      failedSteps: 0,
      currentStepIndex: 0,
      startedAt: Date.now(),
      status: 'RUNNING',
      stepDurations: [],
    };

    this.taskProgress.set(taskId, progress);

    // Emit task started event
    this.eventEmitter.emit(
      ProgressEventType.TASK_STARTED,
      ProgressEvent.taskStarted(taskId, taskInfo)
    );
  }

  /**
   * Reports task planning started
   * @param {string} taskId - Task ID
   * @param {Object} data - Planning data
   */
  reportPlanning(taskId, data = {}) {
    this.eventEmitter.emit(
      ProgressEventType.TASK_PLANNING,
      ProgressEvent.taskPlanning(taskId, data)
    );
  }

  /**
   * Reports task plan is ready
   * @param {string} taskId - Task ID
   * @param {Object} planData - Plan data
   */
  reportPlanReady(taskId, planData = {}) {
    const progress = this.taskProgress.get(taskId);
    if (progress) {
      progress.totalSteps = planData.totalSteps || planData.steps?.length || 0;
    }

    this.eventEmitter.emit(
      ProgressEventType.TASK_PLAN_READY,
      ProgressEvent.taskPlanReady(taskId, planData)
    );
  }

  /**
   * Reports step started
   * @param {string} taskId - Task ID
   * @param {Object} stepInfo - Step information
   */
  startStep(taskId, stepInfo = {}) {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return;

    progress.currentStepIndex = stepInfo.stepIndex ?? progress.currentStepIndex;
    progress.currentStepId = stepInfo.stepId;
    progress.currentStepStartedAt = Date.now();

    this.eventEmitter.emit(
      ProgressEventType.STEP_STARTED,
      ProgressEvent.stepStarted(taskId, {
        ...stepInfo,
        totalSteps: progress.totalSteps,
      })
    );

    // Emit progress update
    this._emitProgressUpdate(taskId);
  }

  /**
   * Reports step completed
   * @param {string} taskId - Task ID
   * @param {Object} stepResult - Step result
   */
  completeStep(taskId, stepResult = {}) {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return;

    progress.completedSteps += 1;
    
    // Calculate duration
    const duration = progress.currentStepStartedAt 
      ? Date.now() - progress.currentStepStartedAt
      : 0;
    
    progress.stepDurations.push(duration);

    this.eventEmitter.emit(
      ProgressEventType.STEP_COMPLETED,
      ProgressEvent.stepCompleted(taskId, {
        ...stepResult,
        duration,
      })
    );

    // Emit progress update
    this._emitProgressUpdate(taskId);
  }

  /**
   * Reports step failed
   * @param {string} taskId - Task ID
   * @param {Object} stepError - Step error information
   */
  failStep(taskId, stepError = {}) {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return;

    progress.failedSteps += 1;

    this.eventEmitter.emit(
      ProgressEventType.STEP_FAILED,
      ProgressEvent.stepFailed(taskId, stepError)
    );
  }

  /**
   * Reports step retry
   * @param {string} taskId - Task ID
   * @param {Object} retryInfo - Retry information
   */
  retryStep(taskId, retryInfo = {}) {
    this.eventEmitter.emit(
      ProgressEventType.STEP_RETRYING,
      ProgressEvent.stepRetrying(taskId, retryInfo)
    );
  }

  /**
   * Reports provider fallback
   * @param {string} taskId - Task ID
   * @param {Object} fallbackInfo - Fallback information
   */
  reportFallback(taskId, fallbackInfo = {}) {
    this.eventEmitter.emit(
      ProgressEventType.PROVIDER_FALLBACK,
      ProgressEvent.providerFallback(taskId, fallbackInfo)
    );
  }

  /**
   * Completes task tracking
   * @param {string} taskId - Task ID
   * @param {Object} result - Task result
   */
  completeTask(taskId, result = {}) {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return;

    const duration = Date.now() - progress.startedAt;
    progress.status = 'COMPLETED';

    this.eventEmitter.emit(
      ProgressEventType.TASK_COMPLETED,
      ProgressEvent.taskCompleted(taskId, {
        ...result,
        duration,
        totalSteps: progress.totalSteps,
        completedSteps: progress.completedSteps,
      })
    );
  }

  /**
   * Fails task tracking
   * @param {string} taskId - Task ID
   * @param {Object} error - Error information
   */
  failTask(taskId, error = {}) {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return;

    progress.status = 'FAILED';

    this.eventEmitter.emit(
      ProgressEventType.TASK_FAILED,
      ProgressEvent.taskFailed(taskId, error)
    );
  }

  /**
   * Gets current progress for a task
   * @param {string} taskId - Task ID
   * @returns {Object|null} Progress information
   */
  getProgress(taskId) {
    const progress = this.taskProgress.get(taskId);
    if (!progress) return null;

    return {
      taskId: progress.taskId,
      goal: progress.goal,
      status: progress.status,
      percentage: this._calculatePercentage(progress),
      currentStep: progress.currentStepIndex + 1,
      totalSteps: progress.totalSteps,
      completedSteps: progress.completedSteps,
      failedSteps: progress.failedSteps,
      estimatedTimeRemaining: this._estimateTimeRemaining(progress),
      duration: Date.now() - progress.startedAt,
    };
  }

  /**
   * Subscribes to progress events
   * @param {string} eventType - Event type (or '*' for all)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    return this.eventEmitter.on(eventType, callback);
  }

  /**
   * Subscribes to all progress events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onAny(callback) {
    return this.eventEmitter.onAny(callback);
  }

  /**
   * Calculates progress percentage
   * @param {Object} progress - Progress object
   * @returns {number} Percentage (0-100)
   * @private
   */
  _calculatePercentage(progress) {
    if (progress.totalSteps === 0) return 0;
    return Math.round((progress.completedSteps / progress.totalSteps) * 100);
  }

  /**
   * Estimates time remaining
   * @param {Object} progress - Progress object
   * @returns {number|null} Estimated milliseconds remaining
   * @private
   */
  _estimateTimeRemaining(progress) {
    if (progress.stepDurations.length === 0 || progress.completedSteps === 0) {
      return null;
    }

    // Calculate average step duration
    const totalDuration = progress.stepDurations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / progress.stepDurations.length;

    // Estimate remaining time
    const remainingSteps = progress.totalSteps - progress.completedSteps;
    return Math.round(remainingSteps * avgDuration);
  }

  /**
   * Emits progress update event
   * @param {string} taskId - Task ID
   * @private
   */
  _emitProgressUpdate(taskId) {
    const progress = this.getProgress(taskId);
    if (!progress) return;

    this.eventEmitter.emit(
      ProgressEventType.PROGRESS_UPDATE,
      ProgressEvent.progressUpdate(taskId, progress)
    );
  }

  /**
   * Clears tracking data for a task
   * @param {string} taskId - Task ID
   */
  clearTask(taskId) {
    this.taskProgress.delete(taskId);
  }

  /**
   * Gets all active tasks
   * @returns {Array<Object>} Active task progress objects
   */
  getActiveTasks() {
    return Array.from(this.taskProgress.values())
      .filter(p => p.status === 'RUNNING')
      .map(p => this.getProgress(p.taskId));
  }
}

module.exports = { ProgressTracker };
