import test from "node:test";
import assert from "node:assert/strict";
import { calculateDeliveryScore, difficultyAt, formatTime, samplePerks, PERKS } from "../src/core.js";

test("delivery score is deterministic and rewards streaks",()=>{assert.equal(calculateDeliveryScore(1),112);assert.ok(calculateDeliveryScore(8)>calculateDeliveryScore(2));assert.equal(calculateDeliveryScore(1,{combo:.25,score:.2}),162)});
test("difficulty rises every 30 seconds and rush begins at 150",()=>{assert.equal(difficultyAt(29).wave,0);assert.equal(difficultyAt(30).wave,1);assert.equal(difficultyAt(149).rush,false);assert.equal(difficultyAt(150).rush,true);assert.ok(difficultyAt(90).spawnEvery<difficultyAt(0).spawnEvery)});
test("perk choices are unique",()=>{const choices=samplePerks(PERKS,3,()=>0);assert.equal(new Set(choices.map(x=>x.id)).size,3)});
test("time formatting clamps to zero",()=>{assert.equal(formatTime(180),"03:00");assert.equal(formatTime(0),"00:00");assert.equal(formatTime(-3),"00:00")});
