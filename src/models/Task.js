/**
 * @fileoverview Task Model
 * Represents a user-level goal composed of ordered automation steps.
 * Tasks are resumable, replayable, and track complete execution state.
 */

const { AutomationStep, StepStatus } = require('./AutomationStep');

/**
 * Task status enumeration
 * @enum {string}
 * @readonly
 */
const TaskStatus = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  WAITING_FOR_INPUT: 'WAITING_FOR_INPUT',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
});

/**
 * Valid state transitions
 * @type {Object.<string, Array<string>>}
 */
const VALID_TRANSITIONS = {
  [TaskStatus.PENDING]: [TaskStatus.RUNNING],
  [TaskStatus.RUNNING]: [TaskStatus.PAUSED, TaskStatus.WAITING_FOR_INPUT, TaskStatus.FAILED, TaskStatus.COMPLETED],
  [TaskStatus.PAUSED]: [TaskStatus.RUNNING, TaskStatus.FAILED],
  [TaskStatus.WAITING_FOR_INPUT]: [TaskStatus.RUNNING, TaskStatus.FAILED],
  [TaskStatus.FAILED]: [],
  [TaskStatus.COMPLETED]: [],
};

/**
 * Task class representing a user goal
 * @class
 */
class Task {
  /**
   * @param {Object} config - Task configuration
   * @param {string} config.goal - Human-readable goal description
   * @param {Array<AutomationStep>} [config.steps] - Ordered automation steps
   * @param {string} [config.id] - Unique task identifier
   * @param {Object} [config.metadata] - Additional metadata
   * @throws {Error} If task configuration is invalid
   */
  constructor({
    goal,
    steps = [],
    id,
    metadata = {},
  }) {
    if (!goal || typeof goal !== 'string') {
      throw new Error('Task must have a goal description');
    }

    this.id = id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.goal = goal;
    this.steps = steps;
    this.status = TaskStatus.PENDING;
    this.currentStepIndex = 0;
    this.result = null;
    this.error = null;
    this.inputRequest = null; // Current input request (Phase 3)
    this.providedInput = null; // User-provided input (Phase 3)
    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata,
    };
    this.executionMetadata = {
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      resumedAt: null,
      duration: null,
      totalSteps: steps.length,
      completedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
    };

    // Validate steps
    if (!Array.isArray(steps)) {
      throw new Error('Steps must be an array');
    }

    for (const step of steps) {
      if (!(step instanceof AutomationStep)) {
        throw new Error('All steps must be AutomationStep instances');
      }
    }
  }

  /**
   * Adds a step to the task
   * @param {AutomationStep} step - Step to add
   * @throws {Error} If step is invalid or task is not in PENDING status
   */
  addStep(step) {
    if (!(step instanceof AutomationStep)) {
      throw new Error('Step must be an AutomationStep instance');
    }

    if (this.status !== TaskStatus.PENDING) {
      throw new Error(`Cannot add steps to a task in ${this.status} status`);
    }

    this.steps.push(step);
    this.executionMetadata.totalSteps = this.steps.length;
    this._updateTimestamp();
  }

  /**
   * Gets the next pending step to execute
   * @returns {AutomationStep|null} Next step or null if no more steps
   */
  getNextStep() {
    if (this.currentStepIndex >= this.steps.length) {
      return null;
    }

    const step = this.steps[this.currentStepIndex];
    if (step.status === StepStatus.PENDING) {
      return step;
    }

    // Find next pending step
    for (let i = this.currentStepIndex + 1; i < this.steps.length; i++) {
      if (this.steps[i].status === StepStatus.PENDING) {
        this.currentStepIndex = i;
        return this.steps[i];
      }
    }

    return null;
  }

  /**
   * Gets the current step being executed
   * @returns {AutomationStep|null} Current step or null
   */
  getCurrentStep() {
    if (this.currentStepIndex >= this.steps.length) {
      return null;
    }
    return this.steps[this.currentStepIndex];
  }

  /**
   * Updates a specific step's status and result
   * @param {string} stepId - Step identifier
   * @param {Object} update - Update object
   * @param {string} [update.status] - New status
   * @param {Object} [update.result] - Execution result
   * @param {Error|Object} [update.error] - Error if failed
   */
  updateStep(stepId, update) {
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step ${stepId} not found in task`);
    }

    const step = this.steps[stepIndex];

    if (update.status === StepStatus.SUCCESS && update.result) {
      step.markAsSuccess(update.result);
      this.executionMetadata.completedSteps += 1;
    } else if (update.status === StepStatus.FAILED && update.error) {
      step.markAsFailed(update.error);
      this.executionMetadata.failedSteps += 1;
    } else if (update.status === StepStatus.SKIPPED) {
      step.markAsSkipped();
      this.executionMetadata.skippedSteps += 1;
    }

    this._updateTimestamp();
  }

  /**
   * Advances to the next step
   */
  advanceToNextStep() {
    this.currentStepIndex += 1;
    this._updateTimestamp();
  }

  /**
   * Transitions task to a new status
   * @param {string} newStatus - New task status
   * @throws {Error} If transition is invalid
   */
  transitionTo(newStatus) {
    if (!Object.values(TaskStatus).includes(newStatus)) {
      throw new Error(`Invalid task status: ${newStatus}`);
    }

    const validTransitions = VALID_TRANSITIONS[this.status];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid transition from ${this.status} to ${newStatus}`);
    }

    const oldStatus = this.status;
    this.status = newStatus;

    // Update execution metadata based on transition
    if (newStatus === TaskStatus.RUNNING && oldStatus === TaskStatus.PENDING) {
      this.executionMetadata.startedAt = new Date().toISOString();
    } else if (newStatus === TaskStatus.RUNNING && oldStatus === TaskStatus.PAUSED) {
      this.executionMetadata.resumedAt = new Date().toISOString();
    } else if (newStatus === TaskStatus.PAUSED) {
      this.executionMetadata.pausedAt = new Date().toISOString();
    } else if (newStatus === TaskStatus.COMPLETED || newStatus === TaskStatus.FAILED) {
      this.executionMetadata.completedAt = new Date().toISOString();
      this._calculateDuration();
    }

    this._updateTimestamp();
  }

  /**
   * Marks task as completed with final result
   * @param {Object} result - Final task result
   */
  complete(result) {
    this.result = result;
    this.transitionTo(TaskStatus.COMPLETED);
  }

  /**
   * Marks task as failed with error
   * @param {Error|Object} error - Error that caused failure
   */
  fail(error) {
    this.error = error instanceof Error ? error.message : error;
    this.transitionTo(TaskStatus.FAILED);
  }

  /**
   * Pauses task execution
   */
  pause() {
    this.transitionTo(TaskStatus.PAUSED);
  }

  /**
   * Requests user input and pauses execution
   * @param {Object} inputRequest - Input request details
   */
  requestInput(inputRequest) {
    this.metadata.inputRequest = inputRequest;
    this.transitionTo(TaskStatus.WAITING_FOR_INPUT);
  }

  /**
   * Resumes task execution
   * @throws {Error} If task is not paused or waiting for input
   */
  resume() {
    if (this.status !== TaskStatus.PAUSED && this.status !== TaskStatus.WAITING_FOR_INPUT) {
      throw new Error(`Cannot resume task from ${this.status} status`);
    }
    this.transitionTo(TaskStatus.RUNNING);
  }

  /**
   * Gets task progress as percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    if (this.steps.length === 0) return 0;
    
    const completedCount = this.steps.filter(
      s => s.status === StepStatus.SUCCESS || s.status === StepStatus.SKIPPED
    ).length;

    return Math.round((completedCount / this.steps.length) * 100);
  }

  /**
   * Checks if task is in a terminal state
   * @returns {boolean} True if task is completed or failed
   */
  isTerminal() {
    return this.status === TaskStatus.COMPLETED || this.status === TaskStatus.FAILED;
  }

  /**
   * Gets all step results
   * @returns {Array<Object>} Array of step results
   */
  getAllStepResults() {
    return this.steps.map(step => ({
      stepId: step.id,
      description: step.description,
      status: step.status,
      result: step.result,
      error: step.error,
    }));
  }

  /**
   * Calculates total execution duration
   * @private
   */
  _calculateDuration() {
    if (this.executionMetadata.startedAt && this.executionMetadata.completedAt) {
      const start = new Date(this.executionMetadata.startedAt);
      const end = new Date(this.executionMetadata.completedAt);
      this.executionMetadata.duration = end - start;
    }
  }

  /**
   * Updates the updatedAt timestamp
   * @private
   */
  _updateTimestamp() {
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Serializes the task to a plain object
   * @returns {Object} Serialized task
   */
  toJSON() {
    return {
      id: this.id,
      goal: this.goal,
      steps: this.steps.map(step => step.toJSON()),
      status: this.status,
      currentStepIndex: this.currentStepIndex,
      result: this.result,
      error: this.error,
      metadata: this.metadata,
      executionMetadata: this.executionMetadata,
    };
  }

  /**
   * Creates a Task from a plain object
   * @param {Object} json - Serialized task
   * @returns {Task} Deserialized task
   */
  static fromJSON(json) {
    const steps = json.steps.map(stepJson => AutomationStep.fromJSON(stepJson));
    const task = new Task({
      goal: json.goal,
      steps,
      id: json.id,
      metadata: json.metadata,
    });

    task.status = json.status;
    task.currentStepIndex = json.currentStepIndex;
    task.result = json.result;
    task.error = json.error;
    task.executionMetadata = json.executionMetadata;

    return task;
  }
}

module.exports = {
  Task,
  TaskStatus,
  VALID_TRANSITIONS,
};
