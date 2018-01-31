const path = require('path');

module.exports = dirs => {
  const paths = [];

  Object.keys(dirs).forEach(dir => {
    const files = dirs[dir];
    paths.push.apply(paths, files.map(f => path.join(dir, f)));
  });

  return paths;
};
