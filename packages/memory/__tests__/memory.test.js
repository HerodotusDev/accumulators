'use strict';

const memory = require('..');
const assert = require('assert').strict;

assert.strictEqual(memory(), 'Hello from memory');
console.info('memory tests passed');
