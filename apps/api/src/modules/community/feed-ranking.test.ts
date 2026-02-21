import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePostScore, urgentDeliveryPlan } from './feed-ranking.js';

test('calculatePostScore rewards urgent and important strongly', () => {
  const base = calculatePostScore({
    likesCount: 10,
    commentsCount: 5,
    importantVotes: 0,
    urgentVotes: 0,
    createdAt: new Date(),
    suspiciousSignalsCount: 0,
  });
  const boosted = calculatePostScore({
    likesCount: 10,
    commentsCount: 5,
    importantVotes: 2,
    urgentVotes: 1,
    createdAt: new Date(),
    suspiciousSignalsCount: 0,
  });
  assert.ok(boosted > base);
});

test('calculatePostScore penalizes suspicious signal patterns', () => {
  const clean = calculatePostScore({
    likesCount: 1,
    commentsCount: 1,
    importantVotes: 1,
    urgentVotes: 1,
    createdAt: new Date(),
    suspiciousSignalsCount: 0,
  });
  const suspicious = calculatePostScore({
    likesCount: 1,
    commentsCount: 1,
    importantVotes: 1,
    urgentVotes: 1,
    createdAt: new Date(),
    suspiciousSignalsCount: 10,
  });
  assert.ok(suspicious < clean);
});

test('urgentDeliveryPlan maps threshold 1->30 and 10->300', () => {
  const p1 = urgentDeliveryPlan(1, 'Adirai East');
  assert.equal(p1.reach, 30);
  assert.equal(p1.tier, 'local');

  const p10 = urgentDeliveryPlan(10, 'Adirai East');
  assert.equal(p10.reach, 300);
  assert.equal(p10.tier, 'global');
});

