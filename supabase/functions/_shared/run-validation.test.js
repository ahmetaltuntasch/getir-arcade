import test from'node:test';import assert from'node:assert/strict';import{validateRun}from'./run-validation.js';
const now=Date.parse('2026-07-28T12:00:00Z');
const rush={clientRunId:'rush-12345678',gameId:'getir-rush',score:2400,durationSeconds:180,completedAt:new Date(now).toISOString(),metrics:{deliveries:12,perks:5,reason:'complete'}};
test('accepts a plausible completed run',()=>assert.equal(validateRun(rush,now).ok,true));
test('rejects duplicate-friendly short ids',()=>assert.equal(validateRun({...rush,clientRunId:'x'},now).ok,false));
test('rejects future results',()=>assert.equal(validateRun({...rush,completedAt:new Date(now+3600_000).toISOString()},now).ok,false));
test('rejects impossible metrics',()=>assert.equal(validateRun({...rush,metrics:{...rush.metrics,deliveries:999}},now).ok,false));
test('rejects incomplete full-duration claims',()=>assert.equal(validateRun({...rush,durationSeconds:30},now).ok,false));
test('accepts plausible depo overflow',()=>assert.equal(validateRun({clientRunId:'depo-12345678',gameId:'depo-tetris',score:900,durationSeconds:75,completedAt:new Date(now).toISOString(),metrics:{rowsCleared:2,productsCollected:24,bestCombo:2,reason:'overflow'}},now).ok,true));
