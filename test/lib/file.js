'use strict';

const fs = require('fs');
const path = require('path');
const tempy = require('tempy');

module.exports = () => {
  const tempDir = tempy.directory();

  function createFile(fileName, contents) {
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, contents || 'test');

    return {
      path: filePath,
      dir: tempDir,
      write: contents => fs.writeFileSync(filePath, contents),
      delete: () => fs.unlinkSync(filePath)
    };
  }

  createFile.dir = tempDir;

  return createFile;
};
