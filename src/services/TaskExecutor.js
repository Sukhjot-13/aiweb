/**
 * @fileoverview TaskExecutor - Executes complete automation tasks
 * Orchestrates sequential step execution with state management and progress tracking.
 */

import { Task, TaskStatus } from '../models/Task.js';
import { ExecutionResult } from '../models/ExecutionResult.js';
import { StepExecutor } from './StepExecutor.js';

/**
 * TaskExecutor service
 * Executes complete automation tasks
 * @class
 */
class TaskExecutor {
  /**
   * @param {Object} [config] - Executor configuration
   * @param {StepExecutor} [config.stepExecutor] - Step executor instance
   * @param {boolean} [config.continueOnStepFailure=false] - Continue task if step fails
   * @param {boolean} [config.collectAllResults=true] - Collect results from all steps
   */
  constructor(config = {}) {
    this.stepExecutor = config.stepExecutor || new StepExecutor();
    this.continueOnStepFailure = config.continueOnStepFailure ?? false;
    this.collectAllResults = config.collectAllResults ?? true;
  }

  /**
   * Executes an automation task
   * @param {Task} task - Task to execute
   * @param {Object} [context] - Execution context
   * @returns {Promise<ExecutionResult>} Task execution result
   */
  async executeTask(task, _context = {}) {
    try {
      // Validate task is in valid state
      if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.PAUSED) {
        return ExecutionResult.failure({
          message: `Cannot execute task in ${task.status} status`,
        });
      }

      // Transition to RUNNING
      task.transitionTo(TaskStatus.RUNNING);

      const stepResults = [];
      let lastError = null;

      // Execute steps sequentially
      while (true) {
        const step = task.getNextStep();
        
        if (!step) {
          // No more steps to execute
          break;
        }

        // Build step context with previous results
        const stepContext = {
          ..._context,
          taskId: task.id,
          previousResults: stepResults,
        };

        // Execute step
        const stepResult = await this.stepExecutor.executeStep(step, stepContext);

        // Collect result if configured
        if (this.collectAllResults) {
          stepResults.push({
            stepId: step.id,
            stepDescription: step.description,
            result: stepResult,
          });
        }

        // Update task with step result
        task.updateStep(step.id, {
          status: step.status,
          result: stepResult.success ? stepResult.data : null,
          error: stepResult.success ? null : stepResult.error,
        });

        // Check if step failed
        if (!stepResult.success) {
          lastError = stepResult.error;

          if (!this.continueOnStepFailure) {
            // Stop execution on failure
            task.fail(stepResult.error);
            return ExecutionResult.failure(stepResult.error, {
              taskId: task.id,
              completedSteps: stepResults.length,
              totalSteps: task.steps.length,
              stepResults,
            });
          }
        }

        // Advance to next step
        task.advanceToNextStep();
      }

      // All steps executed
      const finalResult = this._buildFinalResult(task, stepResults);

      // Mark task as completed or failed
      if (lastError && !this.continueOnStepFailure) {
        task.fail(lastError);
      } else {
        task.complete(finalResult);
      }

      return ExecutionResult.success(finalResult, {
        taskId: task.id,
        totalSteps: task.steps.length,
        completedSteps: task.executionMetadata.completedSteps,
        failedSteps: task.executionMetadata.failedSteps,
        skippedSteps: task.executionMetadata.skippedSteps,
        duration: task.executionMetadata.duration,
      });

    } catch (error) {
      task.fail(error);
      return ExecutionResult.failure(error, {
        taskId: task.id,
      });
    }
  }

  /**
   * Pauses task execution
   * @param {Task} task - Task to pause
   * @returns {ExecutionResult} Pause result
   */
  pauseTask(task) {
    try {
      task.pause();
      return ExecutionResult.success({
        paused: true,
        currentStepIndex: task.currentStepIndex,
      });
    } catch (error) {
      return ExecutionResult.failure(error);
    }
  }

  /**
   * Resumes task execution
   * @param {Task} task - Task to resume
   * @param {Object} [context] - Execution context
   * @returns {Promise<ExecutionResult>} Execution result
   */
  async resumeTask(task, _context = {}) {
    try {
      task.resume();
      return this.executeTask(task, _context);
    } catch (error) {
      return ExecutionResult.failure(error);
    }
  }

  /**
   * Gets task progress information
   * @param {Task} task - Task to get progress for
   * @returns {Object} Progress information
   */
  getTaskProgress(task) {
    return {
      taskId: task.id,
      goal: task.goal,
      status: task.status,
      progress: task.getProgress(),
      currentStepIndex: task.currentStepIndex,
      totalSteps: task.steps.length,
      completedSteps: task.executionMetadata.completedSteps,
      failedSteps: task.executionMetadata.failedSteps,
      skippedSteps: task.executionMetadata.skippedSteps,
      startedAt: task.executionMetadata.startedAt,
      isTerminal: task.isTerminal(),
    };
  }

  /**
   * Builds final task result from step results
   * @param {Task} task - Executed task
   * @param {Array<Object>} stepResults - Results from all steps
   * @returns {Object} Final result
   * @private
   */
  _buildFinalResult(task, stepResults) {
    // Extract data from successful steps
    const successfulResults = stepResults
      .filter(sr => sr.result.success)
      .map(sr => ({
        stepId: sr.stepId,
        stepDescription: sr.stepDescription,
        data: sr.result.data,
      }));

    // Extract errors from failed steps
    const failedResults = stepResults
      .filter(sr => !sr.result.success)
      .map(sr => ({
        stepId: sr.stepId,
        stepDescription: sr.stepDescription,
        error: sr.result.error,
      }));

    return {
      goal: task.goal,
      successfulSteps: successfulResults,
      failedSteps: failedResults,
      allStepResults: task.getAllStepResults(),
      summary: {
        totalSteps: task.steps.length,
        completed: task.executionMetadata.completedSteps,
        failed: task.executionMetadata.failedSteps,
        skipped: task.executionMetadata.skippedSteps,
      },
    };
  }

  /**
   * Validates task can be executed
   * @param {Task} task - Task to validate
   * @returns {{valid: boolean, errors: Array<string>}} Validation result
   */
  validateTask(task) {
    const errors = [];

    if (!task || !(task instanceof Task)) {
      errors.push('Invalid task instance');
      return { valid: false, errors };
    }

    if (task.steps.length === 0) {
      errors.push('Task has no steps');
    }

    // Validate each step
    task.steps.forEach((step, index) => {
      const stepValidation = step.validate();
      if (!stepValidation.valid) {
        errors.push(`Step ${index} validation failed: ${stepValidation.errors.join(', ')}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { TaskExecutor };
