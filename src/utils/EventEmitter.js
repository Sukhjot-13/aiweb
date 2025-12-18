/**
 * @fileoverview EventEmitter - Simple event emitter implementation
 * Provides pub/sub functionality for progress events and system notifications.
 */

/**
 * EventEmitter class
 * Simple event emitter for progress tracking and notifications
 * @class
 */
class EventEmitter {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Subscribes to an event type
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function (receives event object)
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Unsubscribes from an event type
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback to remove
   */
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    const callbacks = this.listeners.get(eventType);
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty listener arrays
    if (callbacks.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * Emits an event to all subscribers
   * @param {string} eventType - Event type
   * @param {*} eventData - Event data
   */
  emit(eventType, eventData) {
    // Store in history
    this._addToHistory({
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
    });

    // Emit to specific listeners
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      callbacks.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }

    // Emit to wildcard listeners
    if (this.listeners.has('*')) {
      const wildcardCallbacks = this.listeners.get('*');
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ type: eventType, data: eventData });
        } catch (error) {
          console.error('Error in wildcard event listener:', error);
        }
      });
    }
  }

  /**
   * Subscribes to all events (wildcard)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onAny(callback) {
    return this.on('*', callback);
  }

  /**
   * Removes all listeners for an event type (or all if no type specified)
   * @param {string} [eventType] - Event type to clear (optional)
   */
  removeAllListeners(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Gets event history
   * @param {string} [eventType] - Filter by event type (optional)
   * @param {number} [limit] - Limit number of events returned
   * @returns {Array<Object>} Event history
   */
  getHistory(eventType, limit) {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter(event => event.type === eventType);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return [...history];
  }

  /**
   * Clears event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Gets listener count for an event type
   * @param {string} eventType - Event type
   * @returns {number} Number of listeners
   */
  listenerCount(eventType) {
    if (!this.listeners.has(eventType)) {
      return 0;
    }
    return this.listeners.get(eventType).length;
  }

  /**
   * Checks if there are any listeners for an event type
   * @param {string} eventType - Event type
   * @returns {boolean} True if there are listeners
   */
  hasListeners(eventType) {
    return this.listenerCount(eventType) > 0;
  }

  /**
   * Adds event to history
   * @param {Object} event - Event object
   * @private
   */
  _addToHistory(event) {
    this.eventHistory.push(event);

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Subscribe to event once (auto-unsubscribe after first emission)
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(eventType, callback) {
    const wrappedCallback = (eventData) => {
      callback(eventData);
      this.off(eventType, wrappedCallback);
    };

    return this.on(eventType, wrappedCallback);
  }
}

module.exports = { EventEmitter };
