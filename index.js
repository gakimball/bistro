const isObject = require('is-object');
const eachSeries = require('p-each-series');
const Task = require('./lib/task');
const createDependencyGraph = require('./lib/create-dependency-graph');
const logger = require('./lib/logger');

module.exports = class Bistro {
  /**
   * Create a new task runner.
   * @param {Object.<String, Object>} tasks - Tasks to run.
   * @param {Object} options - Extra options.
   */
  constructor(tasks, options) {
    if (!isObject(tasks)) {
      throw new Error('Task list must be an object.');
    }

    this.taskConfigs = tasks;
    this.tasks = new Set();
    this.options = options;
    this.order = createDependencyGraph(this.tasks);
    this.log = logger(this.options.verbose);

    this.setup();
  }

  /**
   * Start the task runner.
   */
  start() {
    this.log('Initialized all tasks');

    eachSeries(this.graph.overallOrder().map(taskName => {
      const task = new Task(this.taskConfigs[taskName], {
        baseDir: this.options.baseDir
      });

      this.tasks.add(task);
      return task.init();
    })).then(() => this.log('All tasks initialized'));
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
   * Run a series of tasks in sequence.
   * @private
   * @param {String[]} tasks - Names of tasks to run, in order.
   * @returns {Promise} Promise which resolves when all tasks have run.
   */
  runSequence(tasks) {
    this.log(`Running tasks ${tasks.join(', ')}`);
    return eachSeries(tasks.map(taskName => this.runTask(taskName))).then(() => {
      this.log(`Done running tasks ${tasks.join(', ')}`);
    });
  }

  /**
   * Run a single task. Dependent tasks will be run in sequence after.
   * @param {String} taskName - Name of task.
   * @returns {Promise} Promise that resolves when the task and its dependents have been run.
   */
  runTask(taskName) {
    const task = this.tasks[taskName];
    this.log(`Running task ${taskName}`);

    return task.run().then(() => {
      const dependencies = this.graph.dependantsOf(taskName);
      this.log(`Done running task ${taskName}, now running dependencies ${dependencies.join(', ')}`);
      return this.runSequence(dependencies).then(() => {
        this.log(`Done running dependencies of ${taskName}`);
      });
    });
  }
};
