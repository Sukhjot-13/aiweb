/**
 * @fileoverview ProgressEvent - Progress event types and models
 * Defines event types and structures for task execution progress tracking.
 */

/**
 * Progress event types enumeration
 * @enum {string}
 * @readonly
 */
const ProgressEventType = Object.freeze({
  TASK_STARTED: 'TASK_STARTED',
  TASK_PLANNING: 'TASK_PLANNING',
  TASK_PLAN_READY: 'TASK_PLAN_READY',
  TASK_EXECUTING: 'TASK_EXECUTING',
  STEP_STARTED: 'STEP_STARTED',
  STEP_COMPLETED: 'STEP_COMPLETED',
  STEP_FAILED: 'STEP_FAILED',
  STEP_RETRYING: 'STEP_RETRYING',
  PROVIDER_FALLBACK: 'PROVIDER_FALLBACK',
  INPUT_REQUESTED: 'INPUT_REQUESTED', // Phase 3
  INPUT_PROVIDED: 'INPUT_PROVIDED',   // Phase 3
  TASK_PAUSED: 'TASK_PAUSED',
  TASK_RESUMED: 'TASK_RESUMED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  REPLAY_STARTED: 'REPLAY_STARTED',   // Phase 4
});

/**
 * ProgressEvent class
 * Represents a progress event during task execution
 * @class
 */
class ProgressEvent {
  /**
   * @param {Object} config - Event configuration
   * @param {string} config.type - Event type from ProgressEventType
   * @param {string} config.taskId - Task identifier
   * @param {Object} [config.data] - Event-specific data
   * @param {Object} [config.metadata] - Additional metadata
   */
  constructor({ type, taskId, data = {}, metadata = {} }) {
    if (!Object.values(ProgressEventType).includes(type)) {
      throw new Error(`Invalid progress event type: ${type}`);
    }

    if (!taskId) {
      throw new Error('taskId is required for progress events');
    }

    this.type = type;
    this.taskId = taskId;
    this.data = data;
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    this.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Serializes event to JSON
   * @returns {Object} Serialized event
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      taskId: this.taskId,
      data: this.data,
      metadata: this.metadata,
    };
  }

  /**
   * Creates ProgressEvent from JSON
   * @param {Object} json - Serialized event
   * @returns {ProgressEvent} Deserialized event
   */
  static fromJSON(json) {
    const event = new ProgressEvent({
      type: json.type,
      taskId: json.taskId,
      data: json.data,
      metadata: json.metadata,
    });
    event.id = json.id;
    return event;
  }

  /**
   * Creates TASK_STARTED event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Task started event
   */
  static taskStarted(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.TASK_STARTED,
      taskId,
      data: {
        goal: data.goal,
        totalSteps: data.totalSteps || 0,
        ...data,
      },
    });
  }

  /**
   * Creates TASK_PLANNING event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Task planning event
   */
  static taskPlanning(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.TASK_PLANNING,
      taskId,
      data: {
        goal: data.goal,
        ...data,
      },
    });
  }

  /**
   * Creates TASK_PLAN_READY event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Plan ready event
   */
  static taskPlanReady(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.TASK_PLAN_READY,
      taskId,
      data: {
        steps: data.steps || [],
        totalSteps: data.totalSteps || 0,
        ...data,
      },
    });
  }

  /**
   * Creates STEP_STARTED event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Step started event
   */
  static stepStarted(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.STEP_STARTED,
      taskId,
      data: {
        stepId: data.stepId,
        stepIndex: data.stepIndex,
        stepDescription: data.stepDescription,
        totalSteps: data.totalSteps,
        ...data,
      },
    });
  }

  /**
   * Creates STEP_COMPLETED event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Step completed event
   */
  static stepCompleted(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.STEP_COMPLETED,
      taskId,
      data: {
        stepId: data.stepId,
        stepIndex: data.stepIndex,
        result: data.result,
        duration: data.duration,
        ...data,
      },
    });
  }

  /**
   * Creates STEP_FAILED event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Step failed event
   */
  static stepFailed(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.STEP_FAILED,
      taskId,
      data: {
        stepId: data.stepId,
        stepIndex: data.stepIndex,
        error: data.error,
        ...data,
      },
    });
  }

  /**
   * Creates STEP_RETRYING event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Step retrying event
   */
  static stepRetrying(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.STEP_RETRYING,
      taskId,
      data: {
        stepId: data.stepId,
        retryCount: data.retryCount,
        maxRetries: data.maxRetries,
        ...data,
      },
    });
  }

  /**
   * Creates PROVIDER_FALLBACK event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Provider fallback event
   */
  static providerFallback(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.PROVIDER_FALLBACK,
      taskId,
      data: {
        fromProvider: data.fromProvider,
        toProvider: data.toProvider,
        reason: data.reason,
        ...data,
      },
    });
  }

  /**
   * Creates TASK_COMPLETED event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Task completed event
   */
  static taskCompleted(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.TASK_COMPLETED,
      taskId,
      data: {
        result: data.result,
        duration: data.duration,
        totalSteps: data.totalSteps,
        completedSteps: data.completedSteps,
        ...data,
      },
    });
  }

  /**
   * Creates TASK_FAILED event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Task failed event
   */
  static taskFailed(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.TASK_FAILED,
      taskId,
      data: {
        error: data.error,
        failedAt: data.failedAt,
        ...data,
      },
    });
  }

  /**
   * Creates PROGRESS_UPDATE event
   * @param {string} taskId - Task ID
   * @param {Object} data - Event data
   * @returns {ProgressEvent} Progress update event
   */
  static progressUpdate(taskId, data = {}) {
    return new ProgressEvent({
      type: ProgressEventType.PROGRESS_UPDATE,
      taskId,
      data: {
        percentage: data.percentage,
        currentStep: data.currentStep,
        totalSteps: data.totalSteps,
        estimatedTimeRemaining: data.estimatedTimeRemaining,
        ...data,
      },
    });
  }
}

module.exports = {
  ProgressEvent,
  ProgressEventType,
};
