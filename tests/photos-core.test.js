// Unit tests for photos/photos-core.js — the pure helpers behind /photos.
// Run: node --test tests/

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../photos/photos-core.js');

// Same pattern the Apps Script uses to accept a shot id.
const SERVER_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('sanitizeName matches the server rules', () => {
  assert.equal(core.sanitizeName('  ../Nok/<b>\u0007  '), 'Nok b');
  assert.equal(core.sanitizeName('น้องฝน  (เพื่อนเจ้าสาว)'), 'น้องฝน (เพื่อนเจ้าสาว)');
  assert.equal(core.sanitizeName('   '), '');
  assert.equal(core.sanitizeName(null), '');
  assert.equal(Array.from(core.sanitizeName('ก'.repeat(60))).length, 40);
});

test('makeShotId is sortable by time and accepted by the server', () => {
  const id = core.makeShotId(new Date(2026, 10, 22, 7, 30, 12), seq([0.5]));
  assert.match(id, /^20261122-073012-[a-z0-9]{6}$/);
  assert.match(id, SERVER_ID_PATTERN);
});

test('makeShotId gives different ids for the same second', () => {
  const at = new Date(2026, 10, 22, 7, 30, 12);
  assert.notEqual(core.makeShotId(at, seq([0.1])), core.makeShotId(at, seq([0.9])));
});

test('fitWithin scales the long edge down and never scales up', () => {
  assert.deepEqual(core.fitWithin(4032, 3024, 2048), { width: 2048, height: 1536 });
  assert.deepEqual(core.fitWithin(3024, 4032, 2048), { width: 1536, height: 2048 });
  assert.deepEqual(core.fitWithin(800, 600, 2048), { width: 800, height: 600 });
});

test('formatStamp looks like a disposable-camera date', () => {
  assert.equal(core.formatStamp(new Date(2026, 10, 22, 9, 0)), "'26 11 22");
  assert.equal(core.formatStamp(new Date(2027, 0, 5)), "'27 1 5");
});

test('backoffDelay grows with attempts and stays capped', () => {
  const lo = seq([0]);
  const hi = seq([0.999]);
  assert.ok(core.backoffDelay(1, lo) < core.backoffDelay(3, lo));
  assert.ok(core.backoffDelay(20, hi) <= 30000);
  assert.ok(core.backoffDelay(1, lo) > 0);
});

test('applyFilmLook warms, adds a vignette and keeps alpha', () => {
  const w = 21;
  const h = 21;
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < px.length; i += 4) {
    px[i] = px[i + 1] = px[i + 2] = 128;
    px[i + 3] = 200;
  }
  core.applyFilmLook(px, w, h, () => 0.5); // 0.5 → zero grain, deterministic
  const at = (x, y) => (y * w + x) * 4;
  const c = at(10, 10);
  const corner = at(0, 0);
  assert.ok(px[c] > px[c + 2], 'centre is warmer (red > blue)');
  assert.ok(px[corner] < px[c], 'corner darker than centre');
  for (let i = 3; i < px.length; i += 4) assert.equal(px[i], 200);
});

test('applyFilmLook grain changes pixels when randomness is not neutral', () => {
  const px = new Uint8ClampedArray(4 * 4 * 4).fill(128);
  const flat = new Uint8ClampedArray(px);
  core.applyFilmLook(flat, 4, 4, () => 0.5);
  core.applyFilmLook(px, 4, 4, seq([0.05, 0.95]));
  assert.notDeepEqual(px, flat);
});

// ---- uploadShot ----

function jsonResponse(obj, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => obj };
}

function fakeFetch(steps) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    return step;
  };
  fn.calls = calls;
  return fn;
}

const BASE = {
  url: 'https://script.example/exec',
  payload: { name: 'Nok', id: 'shot-0001-aaaa', mimeType: 'image/jpeg', data: 'AAAA' },
  sleep: async () => {},
  rand: () => 0.5,
};

test('uploadShot posts JSON as text/plain (no preflight) and reports success', async () => {
  const fetchImpl = fakeFetch([jsonResponse({ status: 'ok' })]);
  const res = await core.uploadShot({ ...BASE, fetchImpl });
  assert.deepEqual(res, { ok: true, confirmed: true, duplicate: false });
  assert.equal(fetchImpl.calls.length, 1);
  const init = fetchImpl.calls[0].init;
  assert.equal(init.method, 'POST');
  assert.equal(init.headers, undefined, 'no custom headers → simple CORS request');
  assert.equal(typeof init.body, 'string');
  assert.deepEqual(JSON.parse(init.body), BASE.payload);
});

test('uploadShot retries temporary server errors, then succeeds', async () => {
  const fetchImpl = fakeFetch([
    jsonResponse({ status: 'error', code: 'server_error' }),
    jsonResponse({}, 503),
    jsonResponse({ status: 'ok', duplicate: true }),
  ]);
  const res = await core.uploadShot({ ...BASE, fetchImpl });
  assert.deepEqual(res, { ok: true, confirmed: true, duplicate: true });
  assert.equal(fetchImpl.calls.length, 3);
});

test('uploadShot stops at once on a permanent error', async () => {
  const fetchImpl = fakeFetch([jsonResponse({ status: 'error', code: 'too_large' })]);
  const res = await core.uploadShot({ ...BASE, fetchImpl });
  assert.deepEqual(res, { ok: false, error: 'too_large', permanent: true });
  assert.equal(fetchImpl.calls.length, 1);
});

test('uploadShot gives up after maxAttempts of server errors without a no-cors send', async () => {
  const fetchImpl = fakeFetch([jsonResponse({ status: 'error', code: 'rate_limited' })]);
  const res = await core.uploadShot({ ...BASE, fetchImpl, maxAttempts: 3 });
  assert.deepEqual(res, { ok: false, error: 'rate_limited' });
  assert.equal(fetchImpl.calls.length, 3);
  assert.ok(fetchImpl.calls.every((c) => c.init.mode !== 'no-cors'));
});

test('when every read fails at the network level, one no-cors send is made and marked unconfirmed', async () => {
  const fetchImpl = fakeFetch([
    new TypeError('Failed to fetch'),
    new TypeError('Failed to fetch'),
    jsonResponse({}, 0), // the opaque no-cors response
  ]);
  const res = await core.uploadShot({ ...BASE, fetchImpl, maxAttempts: 2 });
  assert.deepEqual(res, { ok: true, confirmed: false });
  assert.equal(fetchImpl.calls.length, 3);
  assert.equal(fetchImpl.calls[2].init.mode, 'no-cors');
  assert.equal(fetchImpl.calls[2].init.body, fetchImpl.calls[0].init.body, 'same shot id → server dedupes');
});

test('when the network is really down, the no-cors send fails too and the shot stays failed', async () => {
  const fetchImpl = fakeFetch([new TypeError('Failed to fetch')]);
  const res = await core.uploadShot({ ...BASE, fetchImpl, maxAttempts: 2 });
  assert.deepEqual(res, { ok: false, error: 'network' });
  assert.equal(fetchImpl.calls.length, 3);
});

test('with allowNoCors false (CORS known to work), network failures stay failures', async () => {
  const fetchImpl = fakeFetch([new TypeError('Failed to fetch')]);
  const res = await core.uploadShot({ ...BASE, fetchImpl, maxAttempts: 2, allowNoCors: false });
  assert.deepEqual(res, { ok: false, error: 'network' });
  assert.equal(fetchImpl.calls.length, 2);
  assert.ok(fetchImpl.calls.every((c) => c.init.mode !== 'no-cors'));
});

test('allowNoCors can be a function, read only after the attempts fail', async () => {
  let verified = false;
  const fetchImpl = async (url, init) => {
    verified = true; // e.g. the health check finished while uploads were retrying
    throw new TypeError('Failed to fetch');
  };
  const res = await core.uploadShot({ ...BASE, fetchImpl, maxAttempts: 2, allowNoCors: () => !verified });
  assert.deepEqual(res, { ok: false, error: 'network' });
});

test('a mix of network and server errors does not fall back to no-cors', async () => {
  const fetchImpl = fakeFetch([
    new TypeError('Failed to fetch'),
    jsonResponse({ status: 'error', code: 'server_error' }),
  ]);
  const res = await core.uploadShot({ ...BASE, fetchImpl, maxAttempts: 2 });
  assert.deepEqual(res, { ok: false, error: 'server_error' });
  assert.equal(fetchImpl.calls.length, 2);
});
