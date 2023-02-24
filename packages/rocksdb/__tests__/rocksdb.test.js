'use strict';

const rocksdb = require('..');
const assert = require('assert').strict;

assert.strictEqual(rocksdb(), 'Hello from rocksdb');
console.info('rocksdb tests passed');
