import test from "node:test";
import assert from "node:assert/strict";
import { calculateDeliveryScore, difficultyAt, formatTime, normalizeMovement, samplePerks, PERKS, WORLD_HEIGHT, WORLD_WIDTH } from "../src/core.js";

test("delivery score is deterministic and rewards streaks",()=>{assert.equal(calculateDeliveryScore(1),112);assert.ok(calculateDeliveryScore(8)>calculateDeliveryScore(2));assert.equal(calculateDeliveryScore(1,{combo:.25,score:.2}),162)});
test("difficulty rises every 30 seconds and rush begins at 150",()=>{assert.equal(difficultyAt(29).wave,0);assert.equal(difficultyAt(30).wave,1);assert.equal(difficultyAt(149).rush,false);assert.equal(difficultyAt(150).rush,true);assert.ok(difficultyAt(90).spawnEvery<difficultyAt(0).spawnEvery)});
test("perk choices are unique",()=>{const choices=samplePerks(PERKS,3,()=>0);assert.equal(new Set(choices.map(x=>x.id)).size,3)});
test("time formatting clamps to zero",()=>{assert.equal(formatTime(180),"03:00");assert.equal(formatTime(0),"00:00");assert.equal(formatTime(-3),"00:00")});
test("world size is fixed for fair runs",()=>{assert.equal(WORLD_WIDTH,960);assert.equal(WORLD_HEIGHT,600)});
test("movement input preserves analog speed and clamps diagonals",()=>{assert.deepEqual(normalizeMovement(0,0),{x:0,y:0});assert.deepEqual(normalizeMovement(.5,0),{x:.5,y:0});const diagonal=normalizeMovement(1,1);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-10)});
