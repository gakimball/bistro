/* eslint-disable max-params */

'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const getWatchedFiles = require('./get-watched-files');

const noop = () => {};

module.exports = class Task {
  /**
   * Create a new task.
   * @param {Object} task - Task settings.
   * @param {String} task.pattern - Glob pattern describing files to be processed.
   * @param {Boolean} [task.read=false] - If file contents should be read when running reactions.
   * @param {String[]} [task.run=[]] - Tasks to run after this one.
   * @param {Function} [task.update] - Function to run when a file is added or changed.
   * @param {Function} [task.remove] - Function to run when a file is deleted.
   * @param {Function} [task.thisArg] - `this` to call `update()` and `remove()` with.
   * @param {Object} options - Extra options.
   */
  constructor(task, options) {
    // Properties copied from task config
    this.pattern = task.pattern;
    this.read = task.read || false;
    this.dependencies = task.run || [];
    this.update = task.update || noop;
    this.remove = task.remove || noop;
    this.thisArg = task.thisArg || this;

    // Options
    this.options = options;

    // Flag indicating if the initial pass of file processing has been done
    this.ready = false;
  }

  /**
   * Set up file watchers, which will also cause them to trigger `update()` calls for all existing
   * files.
   * @returns {Object} Chokidar instance.
   */
  init() {
    const watcher = chokidar.watch(path.join(this.options.baseDir, this.pattern), {
      ignoreInitial: true
    });

    this.watcher = watcher;
    return this.watcher;
  }

  /**
   * Process a file.
   * @private
   * @param {String} method - Method to use. Should be `update` or `remove`.
   * @param {String} filePath - Path to pass to task method.
   */
  exec(method, filePath) {
    let contents;

    if (this.read !== false && method === 'update') {
      contents = fs.readFileSync(filePath).toString();
    }

    const name = path.basename(filePath, path.extname(filePath));
    const rtn = this[method].call(this.thisArg, name, filePath, contents);

    return Promise.resolve(rtn);
  }

  /**
   * Process all files.
   */
  run() {
    const watched = getWatchedFiles(this.watcher.getWatched());
    const promises = watched.map(filePath => this.exec('update', filePath));

    return Promise.all(promises);
  }

  /**
   * Stop execution of the task by closing all watchers.
   */
  stop() {
    this.watcher.close();
  }
};
