/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const logger = require('../lib/logger');

chai.use(sinonChai);
const expect = chai.expect;

describe('logger()', () => {
  before(() => {
    // @TODO Figure out how to remove `Bistro: Hello` from Mocha console output
    sinon.stub(console, 'log').callThrough().withArgs('Bistro: ', 'Hello');
  });

  afterEach(() => {
    console.log.resetHistory();
  });

  after(() => {
    console.log.restore();
  });

  it('logs to the console if turned on', () => {
    const log = logger(true);
    log('Hello');
    expect(console.log).to.have.been.calledWithExactly('Bistro: ', 'Hello');
  });

  it('does not log to the console if turned off', () => {
    const log = logger(false);
    log('Hello');
    expect(console.log).to.not.have.been.calledOnce;
  });
});
