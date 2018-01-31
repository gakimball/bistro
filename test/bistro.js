/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const Bistro = require('..');
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
          pattern: '*'
        }
      }, {
        baseDir: __dirname
      });

      expect(b).to.have.property('taskConfigs').eql({
        task: {
          pattern: '*'
        }
      });
      expect(b).to.have.property('options').eql({
        baseDir: __dirname,
        verbose: false
      });
    });
  });

  describe('start()', () => {
    it('runs all tasks', () => {
      const update = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.html');
      const b = new Bistro({
        task: {
          pattern: '*',
          update
        }
      }, {
        baseDir: file.dir
      });

      return b.start().then(() => {
        expect(update).to.have.been.calledOnce;
      });
    });

    it('runs a task when a file changes', () => {
      const update = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.html');
      const b = new Bistro({
        task: {
          pattern: '*',
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
      const file = createFile('index.html');
      const b = new Bistro({
        task: {
          pattern: '*',
          update
        }
      }, {
        baseDir: file.dir
      });
      const assert = () => expect(update).to.have.been.calledTwice;

      return b.start().then(() => {
        createFile('index-2.html');
        setTimeout(assert, 500);
      });
    });

    it('runs a task when a file is deleted', () => {
      const remove = sinon.spy();
      const createFile = createFolder();
      const file = createFile('index.html');
      const b = new Bistro({
        task: {
          pattern: '*',
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
      const file = createFile('index.html');
      const update = sinon.spy();
      const b = new Bistro({
        task: {
          pattern: '*',
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
      const file = createFile('index.html');
      const update = sinon.spy();
      const b = new Bistro({
        task: {
          pattern: '*',
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
      const file = createFile('index.html');
      const order = [];
      const b = new Bistro({
        one: {
          pattern: '*',
          update() {
            order.push('one');
          },
          run: ['two']
        },
        two: {
          pattern: '*',
          update() {
            order.push('two');
          },
          run: ['three']
        },
        three: {
          pattern: '*',
          update() {
            order.push('three');
          },
          run: ['four']
        },
        four: {
          pattern: '*',
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
  });
});
