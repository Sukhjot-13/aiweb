/**
 * @fileoverview InputRequestManager - Manages user input requests
 * Handles creation, validation, and resolution of input requests during task execution.
 */

import InputRequest from '../models/InputRequest.js';
import { InputRequestType } from '../models/InputRequestTypes.js';

/**
 * Input request manager
 * Central hub for managing user input requests
 */
export default class InputRequestManager {
  constructor() {
    this.activeRequests = new Map(); // requestId -> InputRequest
    this.requestsByTask = new Map(); // taskId -> Set of requestIds
  }

  /**
   * Create an input request
   * @param {string} taskId - Associated task ID
   * @param {Object} config - Request configuration
   * @returns {InputRequest} Created request
   */
  createRequest(taskId, config) {
    const request = new InputRequest(config);

    // Store request
    this.activeRequests.set(request.id, request);

    // Track by task
    if (!this.requestsByTask.has(taskId)) {
      this.requestsByTask.set(taskId, new Set());
    }
    this.requestsByTask.get(taskId).add(request.id);

    return request;
  }

  /**
   * Get request by ID
   * @param {string} requestId - Request ID
   * @returns {InputRequest|null} Request or null
   */
  getRequest(requestId) {
    return this.activeRequests.get(requestId) || null;
  }

  /**
   * Get all requests for a task
   * @param {string} taskId - Task ID
   * @returns {Array<InputRequest>} Requests
   */
  getTaskRequests(taskId) {
    const requestIds = this.requestsByTask.get(taskId) || new Set();
    return Array.from(requestIds)
      .map(id => this.activeRequests.get(id))
      .filter(req => req !== undefined);
  }

  /**
   * Get pending request for a task
   * @param {string} taskId - Task ID
   * @returns {InputRequest|null} Pending request or null
   */
  getPendingRequest(taskId) {
    const requests = this.getTaskRequests(taskId);
    return requests.find(req => req.status === 'pending') || null;
  }

  /**
   * Validate input for a request
   * @param {string} requestId - Request ID
   * @param {*} input - User input
   * @returns {{valid: boolean, errors: Array<string>}} Validation result
   */
  validateInput(requestId, input) {
    const request = this.getRequest(requestId);
    
    if (!request) {
      return {
        valid: false,
        errors: ['Request not found'],
      };
    }

    return request.validate(input);
  }

  /**
   * Resolve request with user input
   * @param {string} requestId - Request ID
   * @param {*} input - User input
   * @returns {{success: boolean, request?: InputRequest, errors?: Array<string>}} Result
   */
  resolveRequest(requestId, input) {
    const request = this.getRequest(requestId);
    
    if (!request) {
      return {
        success: false,
        errors: ['Request not found'],
      };
    }

    if (request.status !== 'pending') {
      return {
        success: false,
        errors: [`Request already ${request.status}`],
      };
    }

    const validationResult = request.setResponse(input);
    
    if (!validationResult.valid) {
      return {
        success: false,
        errors: validationResult.errors,
      };
    }

    return {
      success: true,
      request,
    };
  }

  /**
   * Cancel a request
   * @param {string} requestId - Request ID
   * @returns {boolean} True if cancelled
   */
  cancelRequest(requestId) {
    const request = this.getRequest(requestId);
    
    if (!request) return false;

    request.cancel();
    return true;
  }

  /**
   * Clear all requests for a task
   * @param {string} taskId - Task ID
   */
  clearTaskRequests(taskId) {
    const requestIds = this.requestsByTask.get(taskId) || new Set();
    
    for (const requestId of requestIds) {
      this.activeRequests.delete(requestId);
    }
    
    this.requestsByTask.delete(taskId);
  }

  /**
   * Get statistics
   * @returns {Object} Stats
   */
  getStats() {
    const allRequests = Array.from(this.activeRequests.values());
    
    return {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending').length,
      responded: allRequests.filter(r => r.status === 'responded').length,
      cancelled: allRequests.filter(r => r.status === 'cancelled').length,
      tasks: this.requestsByTask.size,
    };
  }

  /**
   * Create common request types - helper methods
   */

  /**
   * Create text input request
   * @param {string} taskId - Task ID
   * @param {string} prompt - Prompt text
   * @param {Object} [options] - Options
   * @returns {InputRequest}
   */
  requestText(taskId, prompt, options = {}) {
    return this.createRequest(taskId, {
      type: InputRequestType.TEXT,
      prompt,
      options,
      validation: options.required ? [{ type: 'REQUIRED' }] : [],
    });
  }

  /**
   * Create confirmation request
   * @param {string} taskId - Task ID
   * @param {string} prompt - Prompt text
   * @returns {InputRequest}
   */
  requestConfirmation(taskId, prompt) {
    return this.createRequest(taskId, {
      type: InputRequestType.CONFIRMATION,
      prompt,
    });
  }

  /**
   * Create choice request
   * @param {string} taskId - Task ID
   * @param {string} prompt - Prompt text
   * @param {Array<string>} choices - Available choices
   * @returns {InputRequest}
   */
  requestChoice(taskId, prompt, choices) {
    return this.createRequest(taskId, {
      type: InputRequestType.CHOICE,
      prompt,
      options: { choices },
    });
  }
}
