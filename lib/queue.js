const EventEmitter = require('events');

/**
 * Small wrapper around `Set` to construct a one-time queue. The first time the queue is emptied,
 * a callback is run.
 */
module.exports = class Queue extends EventEmitter {
  /**
   * Create a new queue.
   */
  constructor() {
    super();

    /**
     * Queue contents.
     * @type Set
     */
    this.items = new Set();
  }

  /**
   * Add an item to the queue.
   * @param item - Item to add.
   */
  add(item) {
    this.items.add(item);
  }

  /**
   * Remove an item from the queue.
   * @param item - Item to remove.
   */
  remove(item) {
    this.items.delete(item);

    if (this.items.size === 0) {
      this.emit('empty');
    }
  }
};
