import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDependencies } from '../core/dependency-graph.mjs';

const skill = (name, requires = []) => ({ name, requires });

test('detects cycles', () => {
  const result = analyzeDependencies([skill('a', ['b']), skill('b', ['a'])]);
  assert.deepEqual(result.cycles, [['a', 'b', 'a']]);
});

test('detects missing dependencies', () => {
  const result = analyzeDependencies([skill('a', ['ghost'])]);
  assert.deepEqual(result.missing, [{ skill: 'a', requires: 'ghost' }]);
});

test('produces topological install order when clean', () => {
  const result = analyzeDependencies([skill('app', ['lib']), skill('lib')]);
  assert.deepEqual(result.order, ['lib', 'app']);
  assert.equal(result.cycles.length, 0);
});

test('detects duplicate names', () => {
  const result = analyzeDependencies([skill('a'), skill('a')]);
  assert.deepEqual(result.duplicates, ['a']);
});
