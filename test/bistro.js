/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const Bistro = require('../lib/bistro');
const createFolder = require('./lib/file');

chai.use(sinonChai);
const expect = chai.expect;

describe('Bistro', () => {
  describe('constructor', () => {
    it('creates a new instance of Bistro', () => {
      expect(new Bistro({})).to.be.an.instanceOf(Bistro);
    });

    it('copies task configs and options', () => {
      const b = new Bistro({
        task: {
          pattern: '*.test'
        }
      }, {
        baseDir: __dirname
      });

      expect(b).to.have.property('taskConfigs').eql({
        task: {
          pattern: '*.test'
        }
      });
      expect(b).to.have.deep.property('options.baseDir', __dirname);
    });
  });

  describe('start()', () => {
    it('runs all tasks', () => {
      const update = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.test');
      const b = new Bistro({
        task: {
          pattern: '*.test',
          update
        }
      }, {
        baseDir: file.dir
      });

      return b.start().then(() => {
        expect(update).to.have.been.calledOnce;
      });
    });

    it('runs a callback when everything is done', () => {
      const onTaskFinish = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.test');
      const b = new Bistro({
        task: {
          pattern: '*'
        }
      }, {
        baseDir: file.dir,
        onTaskFinish
      });

      return b.start().then(() => {
        expect(onTaskFinish).to.have.been.calledWithExactly({
          taskName: null,
          dependencies: ['task'],
          method: 'update',
          fileName: null
        });
      });
    });

    it('runs a task when a file changes', () => {
      const update = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.test');
      const b = new Bistro({
        task: {
          pattern: '*.test',
          update
        }
      }, {
        baseDir: file.dir
      });
      const assert = () => expect(update).to.have.been.calledTwice;

      return b.start().then(() => {
        file.write('tested');
        setTimeout(assert, 500);
      });
    });

    it('runs a task when a file is added', () => {
      const update = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.test');
      const b = new Bistro({
        task: {
          pattern: '*.test',
          update
        }
      }, {
        baseDir: file.dir
      });
      const assert = () => expect(update).to.have.been.calledTwice;

      return b.start().then(() => {
        createFile('index-2.test');
        setTimeout(assert, 500);
      });
    });

    it('runs a task when a file is deleted', () => {
      const remove = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.test');
      const b = new Bistro({
        task: {
          pattern: '*.test',
          remove
        }
      }, {
        baseDir: file.dir
      });
      const assert = () => expect(remove).to.have.been.calledOnce;

      return b.start().then(() => {
        file.delete();
        setTimeout(assert, 500);
      });
    });
  });

  describe('stop()', () => {
    it('stops running tasks', () => {
      const createFile = createFolder();
      const file = createFile('index.test');
      const update = sinon.spy();
      const b = new Bistro({
        task: {
          pattern: '*.test',
          update
        }
      }, {
        baseDir: file.dir
      });

      return b.start().then(() => {
        b.stop();
        file.write('tested');
        expect(update).to.have.been.calledOnce;
      });
    });
  });

  describe('runTask()', () => {
    it('runs a single task for one file', () => {
      const createFile = createFolder();
      const file = createFile('index.test');
      const update = sinon.spy();
      const b = new Bistro({
        task: {
          pattern: '*.test',
          update
        }
      }, {
        baseDir: file.dir
      });

      return b.start().then(() => b.runTask('task', 'update', file.path)).then(() => {
        expect(update).to.have.been.calledTwice;
      });
    });

    it('runs dependant tasks after', () => {
      const createFile = createFolder();
      const file = createFile('index.test');
      const order = [];
      const b = new Bistro({
        one: {
          pattern: '*.test',
          update() {
            order.push('one');
          },
          run: ['two']
        },
        two: {
          pattern: '*.test',
          update() {
            order.push('two');
          },
          run: ['three']
        },
        three: {
          pattern: '*.test',
          update() {
            order.push('three');
          },
          run: ['four']
        },
        four: {
          pattern: '*.test',
          update() {
            order.push('four');
          }
        }
      }, {
        baseDir: file.dir
      });

      return b.start().then(() => {
        order.length = 0;
        return b.runTask('one', 'update', file.path);
      }).then(() => {
        expect(order).to.eql(['one', 'two', 'three', 'four']);
      });
    });

    it('runs a callback with task info', () => {
      const createFile = createFolder();
      const file = createFile('index.test');
      const onTaskFinish = sinon.spy();
      const b = new Bistro({
        one: {
          pattern: '*.test',
          run: ['two']
        },
        two: {
          pattern: '*.test'
        }
      }, {
        baseDir: file.dir,
        onTaskFinish
      });

      return b.start().then(() => b.runTask('one', 'update', file.path)).then(() => {
        expect(onTaskFinish).to.have.been.calledWithExactly({
          taskName: 'one',
          method: 'update',
          dependencies: ['two'],
          fileName: file.path
        });
      });
    });
  });
});
