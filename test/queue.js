/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const Queue = require('../lib/queue');

chai.use(sinonChai);
const expect = chai.expect;

describe('Queue', () => {
  describe('constructor', () => {
    it('creates a new instance of Queue', () => {
      expect(new Queue()).to.be.an.instanceOf(Queue);
    });

    it('creates a Set', () => {
      expect(new Queue()).to.have.property('items').that.is.an.instanceOf(Set);
    });
  });

  describe('add()', () => {
    it('adds an item to the queue', () => {
      const q = new Queue();
      q.add('one');
      expect(q.items.has('one')).to.be.true;
    });
  });

  describe('remove()', () => {
    it('removes an item from the queue', () => {
      const q = new Queue();
      q.items.add('one');
      q.remove('one');
      expect(q.items.size).to.equal(0);
    });

    it('fires the "empty" event when emptied', done => {
      const spy = sinon.spy();
      const q = new Queue(spy);

      q.on('empty', done);
      q.items.add('one');
      q.remove('one');
    });
  });
});
