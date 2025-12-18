/**
 * @fileoverview ExecutionResult Model
 * Standardized result structure for all automation executions.
 * Provides consistent error categorization and result normalization.
 */

/**
 * Execution status codes
 * @enum {string}
 * @readonly
 */
const ExecutionStatus = Object.freeze({
  SUCCESS: 'SUCCESS',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  FAILURE: 'FAILURE',
  TIMEOUT: 'TIMEOUT',
  RETRY_NEEDED: 'RETRY_NEEDED',
});

/**
 * Error category enumeration
 * @enum {string}
 * @readonly
 */
const ErrorCategory = Object.freeze({
  NETWORK: 'NETWORK',
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  TIMEOUT: 'TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN',
});

/**
 * ExecutionResult class
 * Standardizes all automation execution results
 * @class
 */
class ExecutionResult {
  /**
   * @param {Object} config - Result configuration
   * @param {string} config.status - Execution status
   * @param {*} [config.data] - Result data (any type)
   * @param {Error|Object|string} [config.error] - Error information
   * @param {Object} [config.metadata] - Additional metadata
   * @param {string} [config.errorCategory] - Error category if failed
   */
  constructor({
    status,
    data = null,
    error = null,
    metadata = {},
    errorCategory = null,
  }) {
    if (!status || !Object.values(ExecutionStatus).includes(status)) {
      throw new Error(`Invalid execution status: ${status}`);
    }

    this.status = status;
    this.success = status === ExecutionStatus.SUCCESS || status === ExecutionStatus.PARTIAL_SUCCESS;
    this.data = data;
    this.error = this._normalizeError(error);
    this.errorCategory = errorCategory || (error ? this._categorizeError(error) : null);
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  /**
   * Normalizes error to a consistent format
   * @param {Error|Object|string|null} error - Error to normalize
   * @returns {Object|null} Normalized error or null
   * @private
   */
  _normalizeError(error) {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        name: 'Error',
      };
    }

    if (typeof error === 'object') {
      return {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        ...error,
      };
    }

    return {
      message: String(error),
      name: 'Error',
    };
  }

  /**
   * Categorizes error type
   * @param {Error|Object|string} error - Error to categorize
   * @returns {string} Error category
   * @private
   */
  _categorizeError(error) {
    const errorMessage = typeof error === 'string' 
      ? error.toLowerCase() 
      : (error.message || '').toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (errorMessage.includes('selector') || errorMessage.includes('not found')) {
      return ErrorCategory.SELECTOR_NOT_FOUND;
    }
    if (errorMessage.includes('timeout')) {
      return ErrorCategory.TIMEOUT;
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      return ErrorCategory.VALIDATION_ERROR;
    }
    if (errorMessage.includes('provider')) {
      return ErrorCategory.PROVIDER_ERROR;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Checks if error is retryable based on category
   * @returns {boolean} True if error is retryable
   */
  isRetryable() {
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.PROVIDER_ERROR,
    ];

    return this.errorCategory 
      ? retryableCategories.includes(this.errorCategory)
      : false;
  }

  /**
   * Adds metadata to the result
   * @param {string} key - Metadata key
   * @param {*} value - Metadata value
   */
  addMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Gets metadata value
   * @param {string} key - Metadata key
   * @returns {*} Metadata value or undefined
   */
  getMetadata(key) {
    return this.metadata[key];
  }

  /**
   * Serializes the result to a plain object
   * @returns {Object} Serialized result
   */
  toJSON() {
    return {
      status: this.status,
      success: this.success,
      data: this.data,
      error: this.error,
      errorCategory: this.errorCategory,
      metadata: this.metadata,
    };
  }

  /**
   * Creates an ExecutionResult from a plain object
   * @param {Object} json - Serialized result
   * @returns {ExecutionResult} Deserialized result
   */
  static fromJSON(json) {
    return new ExecutionResult(json);
  }

  /**
   * Creates a successful result
   * @param {*} data - Result data
   * @param {Object} [metadata] - Additional metadata
   * @returns {ExecutionResult} Success result
   * @example
   * const result = ExecutionResult.success({ text: 'Hello World' });
   */
  static success(data, metadata = {}) {
    return new ExecutionResult({
      status: ExecutionStatus.SUCCESS,
      data,
      metadata,
    });
  }

  /**
   * Creates a partial success result
   * @param {*} data - Partial result data
   * @param {string} reason - Reason for partial success
   * @param {Object} [metadata] - Additional metadata
   * @returns {ExecutionResult} Partial success result
   * @example
   * const result = ExecutionResult.partialSuccess(
   *   { items: [1, 2] }, 
   *   'Only 2 of 5 items could be extracted'
   * );
   */
  static partialSuccess(data, reason, metadata = {}) {
    return new ExecutionResult({
      status: ExecutionStatus.PARTIAL_SUCCESS,
      data,
      metadata: {
        partialReason: reason,
        ...metadata,
      },
    });
  }

  /**
   * Creates a failure result
   * @param {Error|Object|string} error - Error information
   * @param {Object} [metadata] - Additional metadata
   * @returns {ExecutionResult} Failure result
   * @example
   * const result = ExecutionResult.failure(new Error('Selector not found'));
   */
  static failure(error, metadata = {}) {
    return new ExecutionResult({
      status: ExecutionStatus.FAILURE,
      error,
      metadata,
    });
  }

  /**
   * Creates a timeout result
   * @param {string} message - Timeout message
   * @param {number} [duration] - Timeout duration in milliseconds
   * @param {Object} [metadata] - Additional metadata
   * @returns {ExecutionResult} Timeout result
   * @example
   * const result = ExecutionResult.timeout('Operation timed out', 30000);
   */
  static timeout(message, duration, metadata = {}) {
    return new ExecutionResult({
      status: ExecutionStatus.TIMEOUT,
      error: message,
      errorCategory: ErrorCategory.TIMEOUT,
      metadata: {
        timeoutDuration: duration,
        ...metadata,
      },
    });
  }

  /**
   * Creates a retry needed result
   * @param {Error|Object|string} error - Error that requires retry
   * @param {Object} [metadata] - Additional metadata
   * @returns {ExecutionResult} Retry needed result
   * @example
   * const result = ExecutionResult.retryNeeded(new Error('Network error'));
   */
  static retryNeeded(error, metadata = {}) {
    return new ExecutionResult({
      status: ExecutionStatus.RETRY_NEEDED,
      error,
      metadata,
    });
  }

  /**
   * Normalizes various result formats to ExecutionResult
   * @param {*} rawResult - Raw result to normalize
   * @returns {ExecutionResult} Normalized result
   */
  static normalize(rawResult) {
    // Already an ExecutionResult
    if (rawResult instanceof ExecutionResult) {
      return rawResult;
    }

    // Plain object with status field
    if (rawResult && typeof rawResult === 'object' && rawResult.status) {
      return ExecutionResult.fromJSON(rawResult);
    }

    // Error object
    if (rawResult instanceof Error) {
      return ExecutionResult.failure(rawResult);
    }

    // Null or undefined
    if (rawResult == null) {
      return ExecutionResult.failure('No result returned');
    }

    // Any other value treated as success
    return ExecutionResult.success(rawResult);
  }
}

module.exports = {
  ExecutionResult,
  ExecutionStatus,
  ErrorCategory,
};
