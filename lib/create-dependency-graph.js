const dependencyGraph = require('dependency-graph');

module.exports = tasks => {
  const graph = new dependencyGraph.DepGraph();
  const keys = Object.keys(tasks);

  keys.forEach(key => {
    graph.addNode(key);
  });

  keys.forEach(key => {
    const task = tasks[key];

    if (task.run) {
      task.run.forEach(dep => {
        graph.addDependency(dep, key);
      });
    }
  });

  return graph;
};
