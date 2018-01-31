/* eslint-env mocha */

'use strict';

const expect = require('chai').expect;
const createDependencyGraph = require('../lib/create-dependency-graph');

describe('createDependencyGraph()', () => {
  it('orders tasks based on their dependencies', () => {
    const tasks = {
      one: {
        run: ['two', 'three']
      },
      two: {},
      three: {
        run: ['four']
      },
      four: {}
    };

    expect(createDependencyGraph(tasks).overallOrder()).to.eql(['one', 'two', 'three', 'four']);
  });
});
