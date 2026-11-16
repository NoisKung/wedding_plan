/**
 * Wedding Moments — guest photo receiver for /photos.
 *
 * Guests type their own name on photos/index.html, take or pick photos,
 * and each photo is POSTed here. Photos are saved to Google Drive as:
 *
 *   <parent folder>/<guest name>/<shot id>.jpg
 *
 * This is a SEPARATE Apps Script project from the RSVP/payment script
 * (Code.gs / google_apps_script.js) on purpose: the photo endpoint can be
 * deployed, redeployed or switched off without touching RSVP or payments.
 *
 * Setup (once):
 *   1. Create a new project at script.google.com and paste this file.
 *   2. Run setup() from the editor. It asks for Drive permission,
 *      creates "Wedding Moments - Guest Photos" in My Drive,
 *      stores its ID in Script Properties, and logs the folder URL.
 *      (To use an existing folder instead, set the Script Property
 *      PHOTOS_FOLDER_ID to that folder's ID before running setup().)
 *   3. Deploy > New deployment > Web app
 *      Execute as: Me — Who has access: Anyone
 *   4. Put the /exec URL into PHOTOS_SCRIPT_URL in photos/index.html.
 *
 * Request: POST, body is a JSON string (sent as text/plain so browsers
 * skip the CORS preflight):
 *   { name, id, mimeType, data }   data = base64 without the data: prefix
 * Response: { status: 'ok' [, duplicate: true] }
 *        or { status: 'error', code }  — see the codes below.
 */

const PHOTOS_FOLDER_NAME = 'Wedding Moments - Guest Photos';
const PHOTOS_FOLDER_PROP = 'PHOTOS_FOLDER_ID';

const MAX_NAME_LENGTH = 40;              // characters (code points)
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // after base64 decoding
const ALLOWED_PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const SHOT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

// Abuse limits. Retries count too, so these sit well above normal use.
const RATE_WINDOW_SECONDS = 600;
const RATE_LIMIT_PER_NAME = 120;   // one guest picking a whole album is ~50
const RATE_LIMIT_GLOBAL = 2000;    // every guest together, per window
const FOLDER_CACHE_SECONDS = 21600; // 6 h, the CacheService maximum

function doGet() {
  return json_({ status: 'ok', service: 'wedding-photos' });
}

function doPost(e) {
  try {
    let body;
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || '');
    } catch (_) {
      return error_('bad_request');
    }
    if (!body || typeof body !== 'object') return error_('bad_request');

    const name = sanitizeGuestName_(body.name);
    if (!name) return error_('name_required');

    const id = String(body.id || '');
    if (!SHOT_ID_PATTERN.test(id)) return error_('bad_id');

    const ext = ALLOWED_PHOTO_TYPES[body.mimeType];
    if (!ext) return error_('bad_type');

    if (typeof body.data !== 'string' || body.data.length === 0) return error_('bad_data');
    // Cheap size check before decoding: base64 is 4 chars per 3 bytes.
    if (body.data.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 + 4) return error_('too_large');

    if (!countRequest_('rl_all', RATE_LIMIT_GLOBAL) ||
        !countRequest_('rl_' + digest_(name), RATE_LIMIT_PER_NAME)) {
      return error_('rate_limited');
    }

    let bytes;
    try {
      bytes = Utilities.base64Decode(body.data);
    } catch (_) {
      return error_('bad_data');
    }
    if (!bytes || bytes.length === 0) return error_('bad_data');
    if (bytes.length > MAX_PHOTO_BYTES) return error_('too_large');

    const parent = getParentFolder_();
    if (!parent) return error_('not_configured');

    const folder = getGuestFolder_(parent, name);
    const fileName = id + '.' + ext;

    // The client retries on timeouts and may resend a photo that already
    // arrived. The shot id makes the retry harmless. Drive search can lag
    // just after a create, so a cache marker is checked first.
    const cache = CacheService.getScriptCache();
    const shotKey = 'shot_' + digest_(name + '/' + fileName);
    if (cache.get(shotKey) || folder.getFilesByName(fileName).hasNext()) {
      return json_({ status: 'ok', duplicate: true });
    }
    folder.createFile(Utilities.newBlob(bytes, body.mimeType, fileName));
    cache.put(shotKey, '1', FOLDER_CACHE_SECONDS);
    return json_({ status: 'ok' });
  } catch (err) {
    console.error('photo upload failed: ' + (err && err.stack ? err.stack : err));
    return error_('server_error');
  }
}

/**
 * Run once from the editor. Safe to run again.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let folder = null;
  const existingId = props.getProperty(PHOTOS_FOLDER_PROP);
  if (existingId) {
    try {
      folder = DriveApp.getFolderById(existingId);
      if (folder.isTrashed()) folder = null;
    } catch (_) {
      folder = null;
    }
  }
  if (!folder) {
    folder = DriveApp.createFolder(PHOTOS_FOLDER_NAME);
    props.setProperty(PHOTOS_FOLDER_PROP, folder.getId());
  }
  console.log('Guest photos will be saved under: ' + folder.getUrl());
}

/**
 * Editor helper: uploads a 1x1 test image as guest "Test Guest".
 * Delete the "Test Guest" folder afterwards.
 */
function testUpload() {
  const onePixelPng =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const out = doPost({
    postData: {
      type: 'text/plain',
      contents: JSON.stringify({
        name: 'Test Guest',
        id: 'test-' + new Date().getTime(),
        mimeType: 'image/png',
        data: onePixelPng,
      }),
    },
  });
  console.log(out.getContent());
}

// ---------------------------------------------------------------------------

function sanitizeGuestName_(raw) {
  const cleaned = String(raw == null ? '' : raw)
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[\/\\<>:"|?*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .trim();
  return Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim();
}

function getParentFolder_() {
  const id = PropertiesService.getScriptProperties().getProperty(PHOTOS_FOLDER_PROP);
  if (!id) return null;
  return DriveApp.getFolderById(id);
}

/**
 * Finds or creates <parent>/<name>. Drive allows two folders with the same
 * name, so creation runs under the script lock; without it a guest who
 * uploads several photos at once could end up with several folders.
 */
function getGuestFolder_(parent, name) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'folder_' + digest_(name);

  const cached = cachedFolder_(cache, cacheKey);
  if (cached) return cached;

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // Another request may have created it while we waited, and Drive search
    // may not show it yet, so check the cache again first.
    const createdMeanwhile = cachedFolder_(cache, cacheKey);
    if (createdMeanwhile) return createdMeanwhile;

    let folder = null;
    const found = parent.getFoldersByName(name);
    while (found.hasNext()) {
      const candidate = found.next();
      if (!candidate.isTrashed()) {
        folder = candidate;
        break;
      }
    }
    if (!folder) folder = parent.createFolder(name);
    cache.put(cacheKey, folder.getId(), FOLDER_CACHE_SECONDS);
    return folder;
  } finally {
    lock.releaseLock();
  }
}

function cachedFolder_(cache, cacheKey) {
  const id = cache.get(cacheKey);
  if (!id) return null;
  try {
    const folder = DriveApp.getFolderById(id);
    return folder.isTrashed() ? null : folder;
  } catch (_) {
    return null; // deleted since it was cached — look it up again
  }
}

/**
 * Counts one request against a fixed window. Returns false once the limit
 * is reached. CacheService is not atomic, so the count is approximate,
 * which is fine for abuse protection.
 */
function countRequest_(key, limit) {
  const cache = CacheService.getScriptCache();
  const current = parseInt(cache.get(key) || '0', 10);
  if (current >= limit) return false;
  cache.put(key, String(current + 1), RATE_WINDOW_SECONDS);
  return true;
}

function digest_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    text,
    Utilities.Charset.UTF_8,
  );
  return bytes.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function error_(code) {
  return json_({ status: 'error', code: code });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
