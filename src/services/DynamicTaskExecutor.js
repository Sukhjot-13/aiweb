/**
 * @fileoverview DynamicTaskExecutor - Dynamic AI-driven task execution
 * Orchestrates the AI feedback loop: Execute → Analyze → Decide → Repeat
 */

import ExecutionContext from './ExecutionContext.js';
import PageStateExtractor from './PageStateExtractor.js';
import { ActionExecutor } from './ActionExecutor.js';
import { AutomationAction } from '../models/AutomationAction.js';
import { ProgressEventType } from '../models/ProgressEvent.js';
import EventEmitter from '../utils/EventEmitter.js';

/**
 * Dynamic task executor with AI feedback loop
 * @extends EventEmitter
 */
export default class DynamicTaskExecutor extends EventEmitter {
  constructor(aiProvider, options = {}) {
    super();
    this.aiProvider = aiProvider;
    this.actionExecutor = new ActionExecutor();
    this.pageExtractor = new PageStateExtractor();
    this.options = {
      maxIterations: options.maxIterations || 50,
      timeout: options.timeout || 300000, // 5 min
      cycleThreshold: options.cycleThreshold || 3,
      ...options,
    };
  }

  /**
   * Execute task with AI feedback loop
   * @param {string} goal - User's goal
   * @param {Object} [options] - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeWithFeedback(goal, options = {}) {
    const context = new ExecutionContext(goal, {
      ...this.options,
      ...options,
    });

    this._emitEvent(ProgressEventType.TASK_STARTED, {
      goal,
      mode: 'dynamic',
    });

    try {
      // Main execution loop
      while (context.shouldContinue().continue) {
        // Check for cycles
        const cycle = context.detectCycle(this.options.cycleThreshold);
        if (cycle.hasCycle) {
          context.markFailed(`Loop detected: visited ${cycle.url} ${cycle.count} times`);
          break;
        }

        // AI decides next action
        const decision = await this._getNextDecision(context);

        // Check if goal achieved
        if (decision.goalAchieved) {
          context.markGoalAchieved(decision.reasoning);
          break;
        }

        // No more actions
        if (!decision.nextAction || decision.nextAction.type === 'NONE') {
          context.markGoalAchieved('No more actions needed');
          break;
        }

        // Execute action
        const result = await this._executeDecision(decision, context);

        // Update context
        context.addAction(decision.nextAction, result);

        // Extract page state if applicable
        if (result.success && result.data) {
          const pageState = this.pageExtractor.extract(result.data);
          context.updatePageState(pageState);

          // Collect data if specified
          if (decision.dataToExtract) {
            await this._extractData(decision.dataToExtract, result.data, context);
          }
        }

        // Emit progress
        this._emitEvent(ProgressEventType.PROGRESS_UPDATE, {
          iteration: context.iterationCount,
          action: decision.nextAction.type,
          goalAchieved: context.goalAchieved,
        });
      }

      // Final check
      const shouldContinue = context.shouldContinue();
      
      if (!context.goalAchieved && !context.failureReason) {
        context.markFailed(shouldContinue.reason || 'Unknown termination');
      }

      // Emit completion
      this._emitEvent(ProgressEventType.TASK_COMPLETED, {
        status: context.goalAchieved ? 'COMPLETED' : 'FAILED',
        summary: context.getSummary(),
      });

      return {
        success: context.goalAchieved,
        goal,
        collectedData: Object.fromEntries(context.collectedData),
        summary: context.getSummary(),
        context: context.toJSON(),
      };
    } catch (error) {
      this._emitEvent(ProgressEventType.TASK_FAILED, {
        error: error.message,
      });

      return {
        success: false,
        goal,
        error: error.message,
        collectedData: Object.fromEntries(context.collectedData),
        summary: context.getSummary(),
      };
    }
  }

  /**
   * Get next decision from AI
   * @private
   */
  async _getNextDecision(context) {
    const aiContext = context.getContextForAI();
    
    try {
      const decision = await this.aiProvider.decideNextAction(aiContext);
      return decision;
    } catch (error) {
      throw new Error(`AI decision failed: ${error.message}`);
    }
  }

  /**
   * Execute AI decision
   * @private
   */
  async _executeDecision(decision, context) {
    const { nextAction } = decision;

    // Create AutomationAction instance
    let action;
    try {
      action = new AutomationAction({
        type: nextAction.type,
        parameters: nextAction.params || nextAction.parameters || {},
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to create action: ${error.message}`,
      };
    }

    // Execute action
    try {
      const result = await this.actionExecutor.executeAction(action);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract data from page
   * @private
   */
  async _extractData(dataToExtract, pageData, context) {
    for (const [key, selector] of Object.entries(dataToExtract)) {
      if (!selector) continue;

      // Simple extraction (in production, would use actual DOM querying)
      const extractedValue = this._mockExtract(selector, pageData);
      
      if (extractedValue) {
        context.collectData(key, extractedValue);
      }
    }
  }

  /**
   * Mock data extraction
   * @private
   */
  _mockExtract(selector, pageData) {
    // Placeholder - in production with real browser, would use actual selectors
    return `extracted_${selector}_${Date.now()}`;
  }

  /**
   * Emit progress event
   * @private
   */
  _emitEvent(type, data) {
    this.emit(type, {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
