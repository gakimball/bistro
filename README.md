# bistro

> File-based task runner

[![Travis](https://img.shields.io/travis/gakimball/bistro.svg?maxAge=2592000)](https://travis-ci.org/gakimball/bistro) [![npm](https://img.shields.io/npm/v/bistro.svg?maxAge=2592000)](https://www.npmjs.com/package/bistro)

Bistro is a small file-based task runner. What _file-based_ means is that every task you define is designed to react to changes to specific files, based on a glob pattern. Along with this glob pattern, each task defines `update()` and `remove()` functions, which run when files matching the pattern are added, changed, or removed. Tasks can also trigger other tasks in response.

This is not a typical task runner that handles transforming and reading/writing of files. It's more for hooking into code that needs to react to changes in the filesystem.

## Installation

```bash
npm install bistro
```

## Usage

Tasks are configured in an object, where each key is a task name and the value is the task itself. At minimum, a task should have these three properties:

- A `pattern` of files to read and watch for changes to.
- An `update` function that is called whenever a file is changed, or a new file is created.
- A `remove` function that is called whenever a file is deleted.

```js
const Bistro = require('bistro');

const bistro = new Bistro({
  a: {
    pattern: 'files/a/*.html',
    update(name, path) {
      // Do something with a new/changed file
    },
    remove(name, path) {
      // Clean up after a file is deleted
    },
  },
  b: {
    pattern: 'files/b/**/*.json',
    read: true, // Turning this on allows you to pass file contents to the below functions
    update(name, path, contents) {
      // Do something with a new/changed file
    },
    remove(name, path, contents) {
      // Clean up after a file is deleted
    },
    run: ['a'], // You can define other tasks to run after one finishes
  },
});

// Run all tasks on existing files, and set up file watchers to monitor for changes
bistro.start();

// Remove file watchers, preventing tasks from running
bistro.stop();
```

## API

### `new Bistro(tasks, options)`

Create a new task runner.

- **tasks** (Object): Tasks for the runner to execute. A task can have these properties:
  - **pattern** (String): Glob pattern of files to search for and watch.
  - **read** (String): If `true`, the `update()` function is called with a third parameter, which is the string contents of the file that was added or changed. This is `false` by default.
  - **thisArg**: Value of `this` within `update()` and `remove()` functions.
  - **update** (Function): Function to run when a file is added or changed. When the task runner starts, this function also runs once for each existing file. The function is called with these properties:
    - **name** (String): The base name of the file. A file with the path `/foo/bar.txt` has the base name of `bar`.
    - **path** (String): Absolute path to the file.
    - **contents** (String): Contents of the file. This is only passed if the task is configured with `{ read: true }`.
  - **remove** (Function) Function to run when a file is deleted.
    - **name** (String): The base name of the file. A file with the path `/foo/bar.txt` has the base name of `bar`.
    - **path** (String): Absolute path to the file.
  - **run** (Array of Strings): Tasks to run after an `update()` or `remove()` function finishes. Tasks will be run in sequence.
- **options** (Object): extra options for the task runner.
  - **baseDir** (String): base directory to prepend to the glob patterns of each task. Defaults to `process.cwd()`.
  - **onTaskFinish** (Function): callback to run when a task and all of its dependencies have run. The function is called with one parameter, an object with these properties:
    - **taskName** (String): name of task that ran.
      - On the initial run, this will be `null`.
    - **dependencies** (Array of Strings): tasks that ran after the initial task, in order.
      - On the initial run, this will contain every task.
    - **method** (String): task function called. Will be `update` or `remove`.
    - **fileName** (String): path to file that was changed or removed.
      - On the initial run, this will be `null`.

#### `bistro.start()`

Start the task runner. All tasks will execute once, and then again when any of their files change. Tasks with dependencies will execute later.

#### `bistro.stop()`

Stop the task runner. File watchers will be removed, preventing tasks from running again.

## Local Development

```bash
git clone https://github.com/gakimball/bistro
cd bistro
npm install
npm test
```

## License

MIT &copy; [Geoff Kimball](http://geoffkimball.com)
