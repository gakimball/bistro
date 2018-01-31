/* eslint-env mocha */

const path = require('path');
const {expect} = require('chai');
const getWatchedFiles = require('../lib/get-watched-files');

describe('getWatchedFiles()', () => {
  it('converts chokidar watched files object into a flat array', () => {
    const input = {
      [process.cwd()]: [
        'index.html',
        'index-2.html'
      ]
    };
    const expected = [
      path.join(process.cwd(), 'index.html'),
      path.join(process.cwd(), 'index-2.html')
    ];

    expect(getWatchedFiles(input)).to.eql(expected);
  });
});
