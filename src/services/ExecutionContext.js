/**
 * @fileoverview ExecutionContext - Execution state management
 * Maintains state across AI decision cycles for dynamic execution.
 */

/**
 * Execution context for dynamic AI-driven task execution
 * Tracks goal, collected data, visited pages, and action history
 */
export default class ExecutionContext {
  /**
   * @param {string} goal - User's goal
   * @param {Object} [options] - Context options
   */
  constructor(goal, options = {}) {
    this.goal = goal;
    this.startingUrl = options.startingUrl || null;
    
    // State
    this.collectedData = new Map();
    this.actionHistory = [];
    this.visitedUrls = new Set();
    this.currentState = null;
    
    // Metadata
    this.startTime = Date.now();
    this.iterationCount = 0;
    this.goalAchieved = false;
    this.failureReason = null;
    
    // Limits
    this.maxIterations = options.maxIterations || 50;
    this.timeout = options.timeout || 300000; // 5 min
  }

  /**
   * Add action to history
   * @param {Object} action - Action taken
   * @param {Object} result - Action result
   */
  addAction(action, result) {
    this.actionHistory.push({
      iteration: this.iterationCount,
      action,
      result,
      timestamp: Date.now(),
      elapsedTime: Date.now() - this.startTime,
    });
    this.iterationCount++;
  }

  /**
   * Collect data
   * @param {string} key - Data key
   * @param {*} value - Data value
   */
  collectData(key, value) {
    this.collectedData.set(key, value);
  }

  /**
   * Append to collected data array
   * @param {string} key - Data key
   * @param {*} value - Value to append
   */
  appendData(key, value) {
    if (!this.collectedData.has(key)) {
      this.collectedData.set(key, []);
    }
    
    const existing = this.collectedData.get(key);
    if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      this.collectedData.set(key, [existing, value]);
    }
  }

  /**
   * Update page state
   * @param {Object} state - Current page state
   */
  updatePageState(state) {
    this.currentState = state;
    if (state.url) {
      this.visitedUrls.add(state.url);
    }
  }

  /**
   * Get context for AI decision-making
   * @returns {Object} Context data for AI
   */
  getContextForAI() {
    return {
      goal: this.goal,
      currentUrl: this.currentState?.url || null,
      pageState: this.currentState,
      collectedData: Object.fromEntries(this.collectedData),
      visitedUrls: Array.from(this.visitedUrls),
      actionCount: this.actionHistory.length,
      iterationCount: this.iterationCount,
      elapsedTime: Date.now() - this.startTime,
      lastAction: this.actionHistory[this.actionHistory.length - 1] || null,
    };
  }

  /**
   * Check if should continue execution
   * @returns {{continue: boolean, reason?: string}} Decision
   */
  shouldContinue() {
    // Goal achieved
    if (this.goalAchieved) {
      return { continue: false, reason: 'Goal achieved' };
    }

    // Max iterations
    if (this.iterationCount >= this.maxIterations) {
      return { continue: false, reason: 'Maximum iterations reached' };
    }

    // Timeout
    if (Date.now() - this.startTime >= this.timeout) {
      return { continue: false, reason: 'Execution timeout' };
    }

    // Failure
    if (this.failureReason) {
      return { continue: false, reason: this.failureReason };
    }

    return { continue: true };
  }

  /**
   * Mark goal as achieved
   * @param {string} [reason] - Achievement reason
   */
  markGoalAchieved(reason) {
    this.goalAchieved = true;
    this.achievementReason = reason;
  }

  /**
   * Mark as failed
   * @param {string} reason - Failure reason
   */
  markFailed(reason) {
    this.failureReason = reason;
  }

  /**
   * Detect cycles (visiting same page repeatedly)
   * @param {number} [threshold=3] - Max visits to same URL
   * @returns {{hasCycle: boolean, url?: string}} Cycle detection result
   */
  detectCycle(threshold = 3) {
    const urlCounts = {};
    
    for (const entry of this.actionHistory) {
      const url = entry.result?.url || entry.result?.currentUrl;
      if (url) {
        urlCounts[url] = (urlCounts[url] || 0) + 1;
        
        if (urlCounts[url] >= threshold) {
          return {
            hasCycle: true,
            url,
            count: urlCounts[url],
          };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Get execution summary
   * @returns {Object} Summary
   */
  getSummary() {
    return {
      goal: this.goal,
      goalAchieved: this.goalAchieved,
      totalIterations: this.iterationCount,
      totalActions: this.actionHistory.length,
      elapsedTime: Date.now() - this.startTime,
      pagesVisited: this.visitedUrls.size,
      dataCollected: this.collectedData.size,
      currentStatus: this.goalAchieved ? 'COMPLETED' : this.failureReason ? 'FAILED' : 'RUNNING',
      failureReason: this.failureReason,
      achievementReason: this.achievementReason,
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      goal: this.goal,
      startingUrl: this.startingUrl,
      collectedData: Object.fromEntries(this.collectedData),
      actionHistory: this.actionHistory,
      visitedUrls: Array.from(this.visitedUrls),
      currentState: this.currentState,
      iterationCount: this.iterationCount,
      goalAchieved: this.goalAchieved,
      failureReason: this.failureReason,
      startTime: this.startTime,
      summary: this.getSummary(),
    };
  }
}
