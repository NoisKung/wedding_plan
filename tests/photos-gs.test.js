// Unit tests for google_apps_script/Photos.gs.
// Apps Script globals (DriveApp, CacheService, ...) are replaced by small
// in-memory fakes so the real script file runs unchanged inside a vm context.
// Run: node --test tests/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'google_apps_script', 'Photos.gs'),
  'utf8',
);

function makeFakeDrive() {
  let nextId = 1;
  const byId = new Map();

  function iterator(items) {
    let i = 0;
    return { hasNext: () => i < items.length, next: () => items[i++] };
  }

  function makeFolder(name) {
    const folder = {
      _id: 'folder-' + nextId++,
      _name: name,
      _trashed: false,
      _folders: [],
      _files: [],
      getId: () => folder._id,
      getName: () => folder._name,
      getUrl: () => 'https://drive.example/' + folder._id,
      isTrashed: () => folder._trashed,
      getFoldersByName: (n) => iterator(folder._folders.filter((f) => f._name === n)),
      getFilesByName: (n) => iterator(folder._files.filter((f) => f.name === n)),
      createFolder: (n) => {
        const child = makeFolder(n);
        folder._folders.push(child);
        return child;
      },
      createFile: (blob) => {
        const file = { name: blob.name, mimeType: blob.mimeType, bytes: blob.bytes };
        folder._files.push(file);
        return file;
      },
    };
    byId.set(folder._id, folder);
    return folder;
  }

  const root = makeFolder('My Drive');
  const DriveApp = {
    getFolderById: (id) => {
      const f = byId.get(id);
      if (!f) throw new Error('No item with the given ID could be found');
      return f;
    },
    createFolder: (n) => root.createFolder(n),
    getRootFolder: () => root,
  };
  return { DriveApp, root, makeFolder };
}

function makeEnv(options = {}) {
  const drive = makeFakeDrive();
  const parent = drive.root.createFolder('Wedding Moments - Guest Photos');
  const props = new Map();
  if (options.configured !== false) props.set('PHOTOS_FOLDER_ID', parent.getId());

  const cacheStore = new Map();
  const lockLog = [];
  const hooks = {};

  const context = {
    console: { log() {}, error() {}, warn() {} },
    DriveApp: drive.DriveApp,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (props.has(k) ? props.get(k) : null),
        setProperty: (k, v) => props.set(k, v),
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cacheStore.has(k) ? cacheStore.get(k) : null),
        put: (k, v) => cacheStore.set(k, String(v)),
      }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {
          lockLog.push('wait');
          if (hooks.onWaitLock) hooks.onWaitLock();
        },
        releaseLock: () => lockLog.push('release'),
      }),
    },
    Utilities: {
      base64Decode: (s) => {
        if (!/^[A-Za-z0-9+/=\s]*$/.test(s)) throw new Error('Could not decode string.');
        return Array.from(Buffer.from(s, 'base64'));
      },
      newBlob: (bytes, mimeType, name) => ({ bytes, mimeType, name }),
      computeDigest: (_alg, value) =>
        Array.from(crypto.createHash('md5').update(value, 'utf8').digest()).map((b) =>
          b > 127 ? b - 256 : b,
        ),
      DigestAlgorithm: { MD5: 'MD5' },
      Charset: { UTF_8: 'UTF_8' },
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({
        text,
        mime: null,
        setMimeType(m) {
          this.mime = m;
          return this;
        },
      }),
    },
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context, { filename: 'Photos.gs' });
  return { ctx: context, parent, props, cacheStore, lockLog, drive, hooks };
}

const EMPTY_ITERATOR = () => ({ hasNext: () => false, next: () => undefined });

function md5hex(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 0xff, 0xd9]);

function post(env, body) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const out = env.ctx.doPost({ parameter: {}, postData: { type: 'text/plain', contents: raw } });
  assert.equal(out.mime, 'application/json');
  return JSON.parse(out.text);
}

function validBody(overrides = {}) {
  return {
    name: 'Nok',
    id: '20261122-073012-a1b2c3',
    mimeType: 'image/jpeg',
    data: JPEG_BYTES.toString('base64'),
    ...overrides,
  };
}

test('doGet answers a health check', () => {
  const env = makeEnv();
  const out = JSON.parse(env.ctx.doGet({}).text);
  assert.equal(out.status, 'ok');
});

test('upload creates a folder named after the guest and saves the decoded file', () => {
  const env = makeEnv();
  const res = post(env, validBody());
  assert.deepEqual(res, { status: 'ok' });
  assert.equal(env.parent._folders.length, 1);
  const guest = env.parent._folders[0];
  assert.equal(guest._name, 'Nok');
  assert.equal(guest._files.length, 1);
  assert.equal(guest._files[0].name, '20261122-073012-a1b2c3.jpg');
  assert.equal(guest._files[0].mimeType, 'image/jpeg');
  assert.deepEqual(Buffer.from(guest._files[0].bytes.map((b) => b & 0xff)), JPEG_BYTES);
});

test('same guest name reuses one folder, even after the folder-id cache is lost', () => {
  const env = makeEnv();
  post(env, validBody({ id: 'shot-0001-aaaa' }));
  env.cacheStore.clear();
  post(env, validBody({ id: 'shot-0002-bbbb' }));
  assert.equal(env.parent._folders.length, 1);
  assert.equal(env.parent._folders[0]._files.length, 2);
});

test('different guest names get separate folders', () => {
  const env = makeEnv();
  post(env, validBody({ name: 'Nok', id: 'shot-0001-aaaa' }));
  post(env, validBody({ name: 'น้องฝน', id: 'shot-0002-bbbb' }));
  const names = env.parent._folders.map((f) => f._name).sort();
  assert.deepEqual(names, ['Nok', 'น้องฝน']);
});

test('retrying the same shot id does not create a duplicate file', () => {
  const env = makeEnv();
  assert.equal(post(env, validBody()).status, 'ok');
  const again = post(env, validBody());
  assert.equal(again.status, 'ok');
  assert.equal(again.duplicate, true);
  assert.equal(env.parent._folders[0]._files.length, 1);
});

test('a retry is still deduped when Drive search has not caught up with the new file', () => {
  const env = makeEnv();
  post(env, validBody());
  const guest = env.parent._folders[0];
  guest.getFilesByName = EMPTY_ITERATOR; // search index lag
  const again = post(env, validBody());
  assert.equal(again.duplicate, true);
  assert.equal(guest._files.length, 1);
});

test('a folder made by another request while we waited for the lock is reused', () => {
  const env = makeEnv();
  env.parent.getFoldersByName = EMPTY_ITERATOR; // search index lag
  const other = env.parent.createFolder('Nok');
  // The other request finished (and cached its folder) while this one waited.
  env.hooks.onWaitLock = () => env.cacheStore.set('folder_' + md5hex('Nok'), other.getId());
  assert.equal(post(env, validBody()).status, 'ok');
  assert.equal(env.parent._folders.length, 1);
  assert.equal(other._files.length, 1);
});

test('a trashed folder with the same name is ignored', () => {
  const env = makeEnv();
  const old = env.parent.createFolder('Nok');
  old._trashed = true;
  post(env, validBody());
  const live = env.parent._folders.filter((f) => !f._trashed);
  assert.equal(live.length, 1);
  assert.notEqual(live[0], old);
  assert.equal(live[0]._files.length, 1);
});

test('guest name is cleaned before it becomes a folder name', () => {
  const env = makeEnv();
  post(env, validBody({ name: '  ../Nok/<b>\u0007  ' }));
  assert.equal(env.parent._folders[0]._name, 'Nok b');
});

test('very long names are cut to 40 characters', () => {
  const env = makeEnv();
  post(env, validBody({ name: 'ก'.repeat(60) }));
  assert.equal(Array.from(env.parent._folders[0]._name).length, 40);
});

test('blank name is rejected and nothing is created', () => {
  const env = makeEnv();
  const res = post(env, validBody({ name: '   ' }));
  assert.equal(res.status, 'error');
  assert.equal(res.code, 'name_required');
  assert.equal(env.parent._folders.length, 0);
});

test('non-image MIME types are rejected', () => {
  const env = makeEnv();
  const res = post(env, validBody({ mimeType: 'text/html' }));
  assert.equal(res.code, 'bad_type');
  assert.equal(env.parent._folders.length, 0);
});

test('shot ids that could escape the file name are rejected', () => {
  const env = makeEnv();
  for (const id of ['../evil', 'a/b', '', 'x'.repeat(100), 'short']) {
    assert.equal(post(env, validBody({ id })).code, 'bad_id', 'id ' + JSON.stringify(id));
  }
  assert.equal(env.parent._folders.length, 0);
});

test('files over the size cap are rejected', () => {
  const env = makeEnv();
  const big = Buffer.alloc(8 * 1024 * 1024 + 1, 1).toString('base64');
  const res = post(env, validBody({ data: big }));
  assert.equal(res.code, 'too_large');
  assert.equal(env.parent._folders.length, 0);
});

test('missing or undecodable image data is rejected', () => {
  const env = makeEnv();
  assert.equal(post(env, validBody({ data: '' })).code, 'bad_data');
  assert.equal(post(env, validBody({ data: '<<not base64>>' })).code, 'bad_data');
  assert.equal(env.parent._folders.length, 0);
});

test('a body that is not JSON gets bad_request', () => {
  const env = makeEnv();
  assert.equal(post(env, 'GuestName=x&GuestCount=1').code, 'bad_request');
});

test('an unconfigured script returns not_configured instead of throwing', () => {
  const env = makeEnv({ configured: false });
  const res = post(env, validBody());
  assert.equal(res.status, 'error');
  assert.equal(res.code, 'not_configured');
});

test('the script lock is always released, even when folder creation fails', () => {
  const env = makeEnv();
  env.parent.createFolder = () => {
    throw new Error('Drive is down');
  };
  const res = post(env, validBody());
  assert.equal(res.code, 'server_error');
  assert.deepEqual(env.lockLog, ['wait', 'release']);
});

test('one guest name is rate limited after too many uploads in the window', () => {
  const env = makeEnv();
  let last;
  for (let i = 0; i < 200; i++) {
    last = post(env, validBody({ id: 'shot-' + String(i).padStart(4, '0') + '-zzzz' }));
    if (last.status !== 'ok') break;
  }
  assert.equal(last.code, 'rate_limited');
  // A different guest is not affected.
  assert.equal(post(env, validBody({ name: 'Fon', id: 'shot-9999-fon1' })).status, 'ok');
});

test('setup() stores a new parent folder id when none is configured', () => {
  const env = makeEnv({ configured: false });
  env.ctx.setup();
  const id = env.props.get('PHOTOS_FOLDER_ID');
  assert.ok(id, 'folder id stored');
  assert.equal(env.drive.DriveApp.getFolderById(id).getName(), 'Wedding Moments - Guest Photos');
  // Running it again keeps the same folder.
  env.ctx.setup();
  assert.equal(env.props.get('PHOTOS_FOLDER_ID'), id);
});
