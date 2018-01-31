const path = require('path');
const isObject = require('is-object');
const eachSeries = require('p-each-series');
const Task = require('./task');
const createDependencyGraph = require('./create-dependency-graph');
const logger = require('./logger');

module.exports = class Bistro {
  /**
   * Create a new task runner.
   * @param {Object.<String, Object>} tasks - Tasks to run.
   * @param {Object} [options={}] - Extra options.
   * @param {String} [options.baseDir=process.cwd()] - Base directory to prepend to glob patterns.
   * @param {Function} [options.onTaskFinish=() => {}] - Function to run when a task finishes.
   * @param {Boolean} [options.verbose=false] - Enable logging.
   */
  constructor(tasks, options = {}) {
    if (!isObject(tasks)) {
      throw new Error('Task list must be an object.');
    }

    this.taskConfigs = tasks;
    this.tasks = new Map();
    this.options = Object.assign({
      baseDir: process.cwd(),
      onTaskFinish: () => {},
      verbose: false
    }, options);
    this.graph = createDependencyGraph(this.taskConfigs);
    this.log = logger(this.options.verbose);
  }

  /**
   * Start the task runner.
   * @returns {Promsie} Promise which resolves when the initial run of tasks has been completed.
   */
  start() {
    this.log('Initialized all tasks');

    const taskOrder = this.graph.overallOrder();

    return eachSeries(taskOrder, taskName => new Promise(resolve => {
      const task = new Task(this.taskConfigs[taskName], {
        baseDir: this.options.baseDir
      });

      this.tasks.set(taskName, task);
      task.init()
        .on('ready', () => {
          task.run().then(resolve);
        })
        .on('add', filePath => this.runTask(taskName, 'update', filePath))
        .on('change', filePath => this.runTask(taskName, 'update', filePath))
        .on('unlink', filePath => this.runTask(taskName, 'remove', filePath));
    }))
      .then(() => {
        this.options.onTaskFinish({
          taskName: null,
          dependencies: taskOrder,
          method: 'update',
          fileName: null
        });
        this.log('All tasks initialized');
      });
  }

  /**
   * Stop the task runner.
   */
  stop() {
    this.log('Stopping all tasks');
    this.tasks.forEach(task => task.stop());
    this.log('Stopped all tasks');
  }

  /**
   * Run a task on a file. Dependent tasks will be run in sequence after.
   * @private
   * @param {String} taskName - Name of task.
   * @param {String} method - Task method to run. Should be `update` or `remove`.
   * @param {String} fileName - File to run task on.
   * @returns {Promise} Promise which resolves when the base task and all of its dependencies
   * have finished.
   */
  runTask(taskName, method, fileName) {
    const task = this.tasks.get(taskName);
    const dependencies = this.graph.dependantsOf(taskName).reverse();

    this.log(`Running task ${taskName} on ${path.basename(fileName)}`);

    return task.exec(method, fileName).then(() => {
      this.log(`Done running task ${taskName}, now running dependencies ${dependencies.join(', ')}`);

      return eachSeries(dependencies, taskName => this.tasks.get(taskName).run());
    }).then(() => {
      this.options.onTaskFinish({taskName, method, dependencies, fileName});
      this.log(`Done running dependencies of ${taskName}`);
    });
  }
};
