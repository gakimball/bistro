/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const event = require('p-event');
const {FSWatcher} = require('chokidar');
const Task = require('../lib/task');

chai.use(sinonChai);
const expect = chai.expect;
const fixturePath = path.join(__dirname, 'fixture');

describe('Task', () => {
  describe('init()', () => {
    it('returns a watcher', () => {
      const task = new Task({
        pattern: '*.json'
      }, {
        baseDir: fixturePath
      });

      expect(task.init()).to.be.an.instanceOf(FSWatcher);
    });
  });

  describe('exec()', () => {
    it('passes name and file path to an update function', () => {
      const update = sinon.spy();
      const task = new Task({
        pattern: '*.json',
        update
      }, {
        baseDir: fixturePath
      });
      const filePath = path.join(fixturePath, 'one.json');

      return event(task.init(), 'ready').then(() => task.exec('update', filePath)).then(() => {
        expect(update).to.have.been.calledWithExactly('one', filePath, undefined);
      });
    });

    it('passes name, file path, and contents to an update function with { read: true }', () => {
      const update = sinon.spy();
      const task = new Task({
        pattern: '*.json',
        read: true,
        update
      }, {
        baseDir: fixturePath
      });
      const filePath = path.join(fixturePath, 'one.json');
      const fileContents = fs.readFileSync(filePath).toString();

      return event(task.init(), 'ready').then(() => task.exec('update', filePath)).then(() => {
        expect(update).to.have.been.calledWithExactly('one', filePath, fileContents);
      });
    });

    it('passes name and file path to a remove function', () => {
      const remove = sinon.spy();
      const task = new Task({
        pattern: '*.json',
        remove
      }, {
        baseDir: fixturePath
      });
      const filePath = path.join(fixturePath, 'one.json');

      return event(task.init(), 'ready').then(() => task.exec('remove', filePath)).then(() => {
        expect(remove).to.have.been.calledWithExactly('one', filePath, undefined);
      });
    });

    it('passes this argument', () => {
      const spy = sinon.spy();
      const thisArg = {};
      const task = new Task({
        pattern: '*.json',
        thisArg,
        update() {
          spy(this);
        }
      }, {
        baseDir: fixturePath
      });
      const filePath = path.join(fixturePath, 'one.json');

      return event(task.init(), 'ready').then(() => task.exec('update', filePath)).then(() => {
        expect(spy).to.have.been.calledWithExactly(thisArg);
      });
    });
  });

  describe('run()', () => {
    it('runs task functions on all watched files', () => {
      const update = sinon.spy();
      const task = new Task({
        pattern: '*.json',
        update
      }, {
        baseDir: fixturePath
      });

      return event(task.init(), 'ready').then(() => task.run()).then(() => {
        expect(update).to.have.been.calledTwice;
      });
    });
  });

  describe('stop()', () => {
    it('stops the watcher', () => {
      const task = new Task({
        pattern: '*.json'
      }, {
        baseDir: fixturePath
      });

      return event(task.init(), 'ready').then(() => {
        const spy = sinon.spy(task.watcher, 'close');
        task.stop();
        expect(spy).to.have.been.calledOnce;
      });
    });
  });
});
