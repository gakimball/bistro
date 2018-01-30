/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const del = require('del');
const Task = require('../lib/task');
const factory = require('./lib/file');

chai.use(sinonChai);
const expect = chai.expect;

describe('Task', () => {
  let create;
  let task;

  before(() => {
    create = factory();
  });

  afterEach(() => {
    task.stop();
    return del(path.join(create.dir, '**/*'), {force: true});
  });

  it('calls the update function immediately', done => {
    const file = create('index.html');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: file.dir
    });

    task.init().then(() => {
      expect(update).to.have.been.calledOnce;
      done();
    });
  });

  it('calls the update function with a name and file path', done => {
    const file = create('index.html', 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: file.dir
    });

    task.init().then(() => {
      expect(update).to.have.been.calledWithExactly('index', file.path, undefined);
      done();
    });
  });

  it('calls the update function when a file changes', done => {
    const file = create('index.html', 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: file.dir
    });

    task.init().then(() => {
      file.write('tested');

      task.on('done', () => {
        expect(update).to.have.been.calledTwice;
        done();
      });
    });
  });

  it('calls the update function when a file is added', done => {
    const fileA = create('index.html');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: fileA.dir
    });

    task.init().then(() => {
      create('index-2.html');

      task.watcher.on('add', () => {
        // Two calls for the original file, one call for the new file
        expect(update).to.have.been.calledThrice;
        done();
      });
    });
  });

  it('calls the remove function when a file is removed', done => {
    const file = create('index.html', 'test');
    const remove = sinon.spy();
    task = new Task({
      pattern: '*.*',
      remove
    }, {
      baseDir: file.dir
    });

    task.init().then(() => {
      file.delete();

      task.watcher.on('unlink', () => {
        expect(remove).to.have.been.calledWithExactly('index', file.path, undefined);
        done();
      });
    });
  });

  it('allows file reading to be enabled', done => {
    const file = create('index.html', 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      read: true,
      update
    }, {
      baseDir: file.dir
    });

    task.init().then(() => {
      expect(update).to.have.been.calledWithExactly('index', file.path, 'test');
      done();
    });
  });

  it('allows a this argument to be passed', done => {
    const file = create('index.html', 'test');
    const spy = sinon.spy();
    const thisArg = {};
    task = new Task({
      pattern: '*.*',
      thisArg,
      update() {
        spy(this);
      }
    }, {
      baseDir: file.dir
    });

    task.init().then(() => {
      expect(spy).to.have.been.calledWithExactly(thisArg);
      done();
    });
  });
});
