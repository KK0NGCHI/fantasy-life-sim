import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameClockAt} from '../dist/engine/v3.js';

test('top bar renders game hour and minute rather than a fixed :00',()=>{
 const source=readFileSync(new URL('../src/v3.js',import.meta.url),'utf8');
 const top=source.slice(source.indexOf('function top(){'),source.indexOf('\nfunction side(){'));
 assert.match(top,/const gameClock=mainV2\.gameTime\(\)/);
 assert.match(top,/String\(minute\)\.padStart\(2,'0'\)/);
 assert.doesNotMatch(top,/String\(s\.hour\)\.padStart\(2,'0'\)\+':00'/);
});
test('global seconds advance the displayed minute and roll over hours and days',()=>{
 assert.deepEqual(gameClockAt(0),{day:1,hour:8,minute:0,second:0});
 assert.deepEqual(gameClockAt(60),{day:1,hour:8,minute:1,second:0});
 assert.deepEqual(gameClockAt(1500),{day:1,hour:8,minute:25,second:0});
 assert.deepEqual(gameClockAt(3600),{day:1,hour:9,minute:0,second:0});
 assert.deepEqual(gameClockAt(57600),{day:2,hour:0,minute:0,second:0});
});
