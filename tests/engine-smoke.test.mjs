import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { ENGINE_STAGE, GAME_STATE_SCHEMA_VERSION } from '../dist/engine/index.js';
test('compiled engine exports stage and schema version', () => {
  assert.equal(ENGINE_STAGE, '01-C');
  assert.equal(GAME_STATE_SCHEMA_VERSION, 1);
});
test('existing browser UI entrypoint remains unchanged', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /src\/v3\.js/);
  assert.match(html, /src\/v8\.css/);
  assert.doesNotMatch(html, /dist\/engine/);
});
