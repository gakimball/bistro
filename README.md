# bistro

> File-based task runner

[![Travis](https://img.shields.io/travis/gakimball/bistro.svg?maxAge=2592000)](https://travis-ci.org/gakimball/bistro) [![npm](https://img.shields.io/npm/v/bistro.svg?maxAge=2592000)](https://www.npmjs.com/package/bistro)

## Installation

```bash
npm install bistro
```

## Usage

A Bistro instances is a series of tasks that run when any file matching a glob pattern changes. A task can also be configured to run other tasks when it finishes. At minimum, a task has three config settings:

- A **pattern** of files to read and watch for changes to.
- An **update** function that is called whenever a file is changed, or a new file is created.
- A **remove** function that is called whenever a file is deleted.

```js
const Bistro = require('bistro');

const bistro = new Bistro({
  a: {
    pattern: 'files/a/*.html',
    update(name, path, contents) {
      // Do something with a new/changed file
    },
    remove(name, path, contents) {
      // Clean up after a file is deleted
    },
  }
});

// Set up the file watchers and run tasks
bistro.start('a');

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

#### `bistro.start()`

Start the task runner. All tasks will execute once, and then again when any of their files change. Tasks with dependencies will execute earlier.

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
