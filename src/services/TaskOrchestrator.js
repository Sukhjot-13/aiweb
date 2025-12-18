/**
 * @fileoverview TaskOrchestrator - Main orchestration service
 * Coordinates goal parsing, task planning, and execution with progress tracking.
 */

const { GoalParser } = require('./GoalParser');
const { TaskPlanner } = require('./TaskPlanner');
const { TaskExecutor } = require('./TaskExecutor');
const { ProgressTracker } = require('./ProgressTracker');

/**
 * TaskOrchestrator class
 * Main orchestration service for automated task execution
 * @class
 */
class TaskOrchestrator {
  /**
   * @param {Object} config - Orchestrator configuration
   * @param {BaseAIProvider} config.aiProvider - AI provider for planning
   * @param {TaskExecutor} [config.taskExecutor] - Task executor instance
   * @param {ProgressTracker} [config.progressTracker] - Progress tracker instance
   */
  constructor(config) {
    if (!config.aiProvider) {
      throw new Error('aiProvider is required');
    }

    this.aiProvider = config.aiProvider;
    this.goalParser = new GoalParser();
    this.taskPlanner = new TaskPlanner({ aiProvider: this.aiProvider });
    this.taskExecutor = config.taskExecutor || new TaskExecutor();
    this.progressTracker = config.progressTracker || new ProgressTracker();
  }

  /**
   * Plans and executes a task from a natural language goal
   * @param {string} goal - Natural language goal
   * @param {Object} [options] - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async planAndExecute(goal, options = {}) {
    let task;

    try {
      // Parse goal
      const parsedGoal = this.goalParser.parse(goal);

      // Start progress tracking
      this.progressTracker.startTask('temp', { goal });

      // Report planning phase
      this.progressTracker.reportPlanning('temp', { parsedGoal });

      // Plan task using AI
      task = await this.taskPlanner.planTask(parsedGoal, options);

      // Update task ID in tracker
      const taskId = task.id;
      this.progressTracker.clearTask('temp');
      this.progressTracker.startTask(taskId, {
        goal: task.goal,
        totalSteps: task.steps.length,
      });

      // Report plan ready
      this.progressTracker.reportPlanReady(taskId, {
        steps: task.steps.map((s, i) => ({
          index: i,
          description: s.description,
        })),
        totalSteps: task.steps.length,
      });

      // Execute task with progress tracking
      const result = await this._executeWithProgress(task);

      // Complete tracking
      this.progressTracker.completeTask(taskId, result.data);

      return result;

    } catch (error) {
      if (task) {
        this.progressTracker.failTask(task.id, {
          error:error.message || String(error),
        });
      }
      throw error;
    }
  }

  /**
   * Plans a task without executing it
   * @param {string} goal - Natural language goal
   * @param {Object} [options] - Planning options
   * @returns {Promise<Task>} Planned task
   */
  async plan(goal, options = {}) {
    const parsedGoal = this.goalParser.parse(goal);
    return this.taskPlanner.planTask(parsedGoal, options);
  }

  /**
   * Executes a pre-planned task with progress tracking
   * @param {Task} task - Task to execute
   * @param {Object} [options] - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async execute(task, options = {}) {
    this.progressTracker.startTask(task.id, {
      goal: task.goal,
      totalSteps: task.steps.length,
    });

    try {
      const result = await this._executeWithProgress(task, options);
      this.progressTracker.completeTask(task.id, result.data);
      return result;
    } catch (error) {
      this.progressTracker.failTask(task.id, {
        error: error.message || String(error),
      });
      throw error;
    }
  }

  /**
   * Executes task with progress event emission
   * @param {Task} task - Task to execute
   * @param {Object} [options] - Execution options
   * @returns {Promise<Object>} Execution result
   * @private
   */
  async _executeWithProgress(task, _options = {}) {
    const taskId = task.id;

    // Hook into task execution to emit progress events
    const originalGetNextStep = task.getNextStep.bind(task);
    const originalUpdateStep = task.updateStep.bind(task);

    let stepIndex = 0;

    // Wrap getNextStep to emit STEP_STARTED
    task.getNextStep = () => {
      const step = originalGetNextStep();
      if (step) {
        this.progressTracker.startStep(taskId, {
          stepId: step.id,
          stepIndex,
          stepDescription: step.description,
        });
      }
      return step;
    };

    // Wrap updateStep to emit STEP_COMPLETED/FAILED
    task.updateStep = (stepId, update) => {
      const result = originalUpdateStep(stepId, update);

      if (update.result) {
        this.progressTracker.completeStep(taskId, {
          stepId,
          stepIndex,
          result: update.result,
        });
        stepIndex++;
      } else if (update.error) {
        this.progressTracker.failStep(taskId, {
          stepId,
          stepIndex,
          error: update.error,
        });
      }

      return result;
    };

    // Execute task
    return this.taskExecutor.executeTask(task);
  }

  /**
   * Subscribes to progress events
   * @param {string} eventType - Event type (or '*' for all)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    return this.progressTracker.on(eventType, callback);
  }

  /**
   * Subscribes to all progress events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onAny(callback) {
    return this.progressTracker.onAny(callback);
  }

  /**
   * Gets current progress for a task
   * @param {string} taskId - Task ID
   * @returns {Object|null} Progress information
   */
  getProgress(taskId) {
    return this.progressTracker.getProgress(taskId);
  }

  /**
   * Gets AI provider statistics
   * @returns {Object} AI provider stats
   */
  getAIStats() {
    return this.aiProvider.getStats();
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return this.taskPlanner.getCacheStats();
  }

  /**
   * Clears plan cache
   */
  clearCache() {
    this.taskPlanner.clearCache();
  }
}

module.exports = { TaskOrchestrator };
