/* eslint-disable max-params */

'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const chokidar = require('chokidar');
const Queue = require('./queue');

const noop = () => {};

module.exports = class Task extends EventEmitter {
  /**
   * Create a new task.
   * @param {Object} task - Task settings.
   * @param {String} task.pattern - Glob pattern describing files to be processed.
   * @param {Boolean} [task.read=false] - If file contents should be read when running reactions.
   * @param {String[]} [task.run=[]] - Tasks to run after this one.
   * @param {Function} [task.update] - Function to run when a file is added or changed.
   * @param {Function} [task.remove] - Function to run when a file is deleted.
   * @param {Function} [task.thisArg] - `this` to call `update()` and `remove()` with.
   * @param {Object} [options] - Extra options.
   * @param {String} [options.baseDir] - Base directory to prepend to glob patterns.
   */
  constructor(task, options = {}) {
    super();

    // Properties copied from task config
    this.pattern = task.pattern;
    this.read = task.read || false;
    this.dependencies = task.run || [];
    this.update = task.update || noop;
    this.remove = task.remove || noop;
    this.thisArg = task.thisArg || this;

    // Options
    this.options = {
      baseDir: options.baseDir || process.cwd()
    };

    // Processing queue
    this.queue = new Queue();

    // Flag indicating if the initial pass of file processing has been done
    this.ready = false;
  }

  /**
   * Set up file watchers, which will also cause them to trigger `update()` calls for all existing
   * files.
   */
  init() {
    return new Promise(resolve => {
      this.queue.once('empty', () => resolve());
      this.watcher = chokidar.watch(path.join(this.options.baseDir, this.pattern))
        .on('add', filePath => this.exec('update', filePath))
        .on('change', filePath => this.exec('update', filePath))
        .on('unlink', filePath => this.exec('remove', filePath));
    });
  }

  /**
   * Process a file.
   * @private
   * @param {String} method - Method to use. Should be `update` or `remove`.
   * @param {String} filePath - Path to pass to task method.
   */
  exec(method, filePath) {
    this.queue.add(filePath);

    let contents;

    if (this.read !== false && method === 'update') {
      contents = fs.readFileSync(filePath).toString();
    }

    const name = path.basename(filePath, path.extname(filePath));
    const rtn = this[method].call(this.thisArg, name, filePath, contents);

    return Promise.resolve(rtn).then(() => {
      this.emit('done');
      this.queue.remove(filePath);
    });
  }

  /**
   * Process all files.
   */
  run() {
    const promises = this.watcher.getWatched().forEach(filePath => this.exec('update', filePath));

    return Promise.all(promises);
  }

  /**
   * Stop execution of the task by closing all watchers.
   */
  stop() {
    this.watcher.close();
  }
};
