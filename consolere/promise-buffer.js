'use strict';

var Promise = require('pinkie-promise');

exports.promiseBuffer = promiseBuffer;

function promiseBuffer () {
  var bufferState = newBufferState();

  return {
    push: push.bind(null, bufferState)
  };
}

function newBufferState () {
  var state = {
    buffer: [],
    laterRunRegistered: false
  };

  state.pendingPromise = new Promise(function (resolve, reject) {
    state.finalResolve = resolve;
    state.finalReject = reject;
  });

  return state;
}

function push (state, promiseTorun) {
//  assert.equal(typeof state, 'object', 'Expect a state')
//  assert.equal(typeof promiseTorun, 'function', 'Expect a function as first argument')

  state.buffer.push(promiseTorun);

  state.laterRunRegistered = registerLaterRun(state);
  return state.pendingPromise;
}

function registerLaterRun (state) {
  if (state.laterRunRegistered) {
    return state.laterRunRegistered;
  }

  process.nextTick(processBuffer.bind(null, state));
  return true; // means that it's running;
}

function processBuffer (state) {
  var chainedPromises = state.buffer.reduce(function (latestPromise, promiseTorun) {
    return latestPromise.then(promiseTorun);
  }, Promise.resolve());

  return chainedPromises
    .then(state.finalResolve)
    .catch(state.finalReject)
    .then(function () {
      Object.assign(state, newBufferState());
    });
}
