/**
 * @fileoverview TaskPlanner - AI-powered task planning
 * Converts parsed goals into executable task plans using AI providers.
 */

import { Task } from '../models/Task.js';
import { AutomationStep } from '../models/AutomationStep.js';

/**
 * TaskPlanner class
 * Plans automation tasks using AI providers
 * @class
 */
class TaskPlanner {
  /**
   * @param {Object} config - Planner configuration
   * @param {BaseAIProvider} config.aiProvider - AI provider instance
   * @param {boolean} [config.cacheEnabled=true] - Enable plan caching
   */
  constructor(config) {
    if (!config.aiProvider) {
      throw new Error('aiProvider is required');
    }

    this.aiProvider = config.aiProvider;
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.planCache = new Map();
  }

  /**
   * Plans a task from a parsed goal
   * @param {Object} parsedGoal - Parsed goal object
   * @param {Object} [options] - Planning options
   * @returns {Promise<Task>} Planned task
   */
  async planTask(parsedGoal, options = {}) {
    // Check cache
    if (this.cacheEnabled) {
      const cached = this._getCachedPlan(parsedGoal.rawGoal);
      if (cached) {
        return this._createTaskFromPlan(cached, parsedGoal);
      }
    }

    // Generate plan using AI
    const aiPlan = await this.aiProvider.generatePlan(
      parsedGoal.rawGoal,
      {
        intent: parsedGoal.intent,
        entities: parsedGoal.entities,
        constraints: parsedGoal.constraints,
        ...options,
      }
    );

    // Validate plan
    this._validatePlan(aiPlan);

    // Cache plan
    if (this.cacheEnabled) {
      this._cachePlan(parsedGoal.rawGoal, aiPlan);
    }

    // Convert to Task
    return this._createTaskFromPlan(aiPlan, parsedGoal);
  }

  /**
   * Creates a Task from an AI-generated plan
   * @param {Object} aiPlan - AI-generated plan
   * @param {Object} parsedGoal - Parsed goal
   * @returns {Task} Created task
   * @private
   */
  _createTaskFromPlan(aiPlan, parsedGoal) {
    const task = new Task({
      goal: parsedGoal.rawGoal,
      metadata: {
        parsedGoal,
        aiPlan: aiPlan.metadata,
        confidence: aiPlan.confidence,
        createdBy: 'TaskPlanner',
      },
    });

    // Add steps from plan
    for (const stepSpec of aiPlan.steps) {
      const step = new AutomationStep({
        action: stepSpec.action,
        description: stepSpec.description || '',
        expectedOutput: stepSpec.expectedOutput || {},
        failureConditions: stepSpec.failureConditions || [],
        metadata: stepSpec.metadata || {},
      });

      task.addStep(step);
    }

    return task;
  }

  /**
   * Validates an AI-generated plan
   * @param {Object} plan - Plan to validate
   * @throws {Error} If plan is invalid
   * @private
   */
  _validatePlan(plan) {
    if (!plan || typeof plan !== 'object') {
      throw new Error('Plan must be an object');
    }

    if (!Array.isArray(plan.steps)) {
      throw new Error('Plan must have steps array');
    }

    if (plan.steps.length === 0) {
      throw new Error('Plan must have at least one step');
    }

    for (const [index, step] of plan.steps.entries()) {
      if (!step.action) {
        throw new Error(`Step ${index} missing action`);
      }

      // Validate action has required properties
      if (!step.action.type || !step.action.parameters) {
        throw new Error(`Step ${index} has invalid action structure`);
      }
    }

    if (typeof plan.confidence !== 'number' || plan.confidence < 0 || plan.confidence > 1) {
      throw new Error('Plan confidence must be a number between 0 and 1');
    }
  }

  /**
   * Gets cached plan
   * @param {string} goal - Goal text
   * @returns {Object|null} Cached plan or null
   * @private
   */
  _getCachedPlan(goal) {
    const cacheKey = this._normalizeCacheKey(goal);
    return this.planCache.get(cacheKey) || null;
  }

  /**
   * Caches a plan
   * @param {string} goal - Goal text
   * @param {Object} plan - Plan to cache
   * @private
   */
  _cachePlan(goal, plan) {
    const cacheKey = this._normalizeCacheKey(goal);
    this.planCache.set(cacheKey, {
      ...plan,
      cachedAt: new Date().toISOString(),
    });

    // Limit cache size
    if (this.planCache.size > 100) {
      const firstKey = this.planCache.keys().next().value;
      this.planCache.delete(firstKey);
    }
  }

  /**
   * Normalizes cache key
   * @param {string} goal - Goal text
   * @returns {string} Normalized cache key
   * @private
   */
  _normalizeCacheKey(goal) {
    return goal.toLowerCase().trim();
  }

  /**
   * Clears plan cache
   */
  clearCache() {
    this.planCache.clear();
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.planCache.size,
      enabled: this.cacheEnabled,
    };
  }
}

export { TaskPlanner };
