/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const tempy = require('tempy');
const del = require('del');
const Task = require('../lib/task');

chai.use(sinonChai);
const expect = chai.expect;

describe('Task', () => {
  let tempDir;
  let task;

  before(() => {
    tempDir = tempy.directory();
  });

  afterEach(() => {
    task.stop();
    return del(path.join(tempDir, '**/*'), {force: true});
  });

  it('calls the update function immediately', done => {
    fs.writeFileSync(path.join(tempDir, 'index.html'), 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      expect(update).to.have.been.calledOnce;
      done();
    });
  });

  it('calls the update function with a name and file path', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      expect(update).to.have.been.calledWithExactly('index', filePath, undefined);
      done();
    });
  });

  it('calls the update function when a file changes', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      fs.writeFileSync(filePath, 'tested');

      task.on('done', () => {
        expect(update).to.have.been.calledTwice;
        done();
      });
    });
  });

  it('calls the update function when a file is added', done => {
    const filePathA = path.join(tempDir, 'index.html');
    const filePathB = path.join(tempDir, 'index-2.html');
    fs.writeFileSync(filePathA, 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      update
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      fs.writeFileSync(filePathB, 'test');

      task.watcher.on('add', () => {
        // Two calls for the original file, one call for the new file
        expect(update).to.have.been.calledThrice;
        done();
      });
    });
  });

  it('calls the remove function when a file is removed', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const remove = sinon.spy();
    task = new Task({
      pattern: '*.*',
      remove
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      fs.unlinkSync(filePath);

      task.watcher.on('unlink', () => {
        expect(remove).to.have.been.calledWithExactly('index', filePath, undefined);
        done();
      });
    });
  });

  it('allows file reading to be enabled', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const update = sinon.spy();
    task = new Task({
      pattern: '*.*',
      read: true,
      update
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      expect(update).to.have.been.calledWithExactly('index', filePath, 'test');
      done();
    });
  });

  it('allows a this argument to be passed', done => {
    const filePath = path.join(tempDir, 'index.html');
    fs.writeFileSync(filePath, 'test');
    const spy = sinon.spy();
    const thisArg = {};
    task = new Task({
      pattern: '*.*',
      thisArg,
      update() {
        spy(this);
      }
    }, {
      baseDir: tempDir
    });

    task.init().then(() => {
      expect(spy).to.have.been.calledWithExactly(thisArg);
      done();
    });
  });
});
