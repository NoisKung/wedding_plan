/*
 * photos-core.js — pure helpers for /photos (no DOM access).
 * Loaded by photos/index.html as a plain <script>, and by
 * tests/photos-core.test.js through require(). No build step.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PhotosCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_NAME_LENGTH = 40;

  // Server error codes that will not change on retry.
  var PERMANENT_ERRORS = [
    'bad_request',
    'name_required',
    'bad_id',
    'bad_type',
    'bad_data',
    'too_large',
    'not_configured',
  ];

  /** Same rules as sanitizeGuestName_ in google_apps_script/Photos.gs. */
  function sanitizeName(raw) {
    var cleaned = String(raw == null ? '' : raw)
      .normalize('NFC')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/[\/\\<>:"|?*]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\.+/, '')
      .trim();
    return Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim();
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  /** "20261122-073012-k3x9qa": sorts by time in Drive, unique per shot. */
  function makeShotId(date, rand) {
    rand = rand || Math.random;
    var stamp =
      date.getFullYear() +
      pad2(date.getMonth() + 1) +
      pad2(date.getDate()) +
      '-' +
      pad2(date.getHours()) +
      pad2(date.getMinutes()) +
      pad2(date.getSeconds());
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var suffix = '';
    for (var i = 0; i < 6; i++) {
      suffix += alphabet[Math.floor(rand() * alphabet.length) % alphabet.length];
    }
    return stamp + '-' + suffix;
  }

  function fitWithin(width, height, maxEdge) {
    var scale = Math.min(1, maxEdge / Math.max(width, height));
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
  }

  /** Disposable-camera style date: '26 11 22 */
  function formatStamp(date) {
    return "'" + String(date.getFullYear()).slice(-2) + ' ' + (date.getMonth() + 1) + ' ' + date.getDate();
  }

  /** Exponential backoff with jitter, capped at 30 s. attempt starts at 1. */
  function backoffDelay(attempt, rand) {
    rand = rand || Math.random;
    var base = Math.min(30000, 1500 * Math.pow(2, attempt - 1));
    return Math.round(base / 2 + rand() * (base / 2));
  }

  /**
   * Film look in place on RGBA pixels: lifted blacks, warm tint,
   * a little contrast, a vignette and luminance grain.
   * rand() === 0.5 gives zero grain (used by tests).
   */
  function applyFilmLook(px, width, height, rand) {
    rand = rand || Math.random;
    var cx = (width - 1) / 2;
    var cy = (height - 1) / 2;
    var maxD2 = cx * cx + cy * cy || 1;
    for (var y = 0; y < height; y++) {
      var dy = y - cy;
      for (var x = 0; x < width; x++) {
        var i = (y * width + x) * 4;
        var dx = x - cx;
        var d2 = (dx * dx + dy * dy) / maxD2; // 0 centre … 1 corner
        var vignette = 1 - 0.38 * d2 * d2;
        var grain = (rand() - 0.5) * 26;

        var r = (px[i] - 128) * 1.08 + 128;
        var g = (px[i + 1] - 128) * 1.08 + 128;
        var b = (px[i + 2] - 128) * 1.08 + 128;

        r = (r * 0.9 + 22) * vignette + grain;
        g = (g * 0.9 + 14) * vignette + grain;
        b = (b * 0.86 + 6) * vignette + grain;

        px[i] = r < 0 ? 0 : r > 255 ? 255 : r;
        px[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        px[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
    return px;
  }

  /**
   * Uploads one shot to the Apps Script web app.
   *
   * The body is a JSON string with no custom headers, so browsers send it as
   * text/plain and skip the CORS preflight that Apps Script cannot answer.
   *
   * If every attempt fails before any readable response (some mobile browsers
   * are reported to block reading Apps Script's redirected response), it sends
   * once more with mode "no-cors". That response cannot be read, so the result
   * is { ok: true, confirmed: false }. The server dedupes by shot id, so the
   * extra send cannot create a duplicate.
   *
   * That fallback also "succeeds" when the script never ran (overloaded, or
   * deployed with the wrong access), so the page passes allowNoCors: false —
   * or a function returning it, read after the attempts — once it knows CORS
   * reads work in this browser. Then network failures stay failures.
   */
  async function uploadShot(opts) {
    var fetchImpl = opts.fetchImpl;
    var sleep = opts.sleep;
    var rand = opts.rand || Math.random;
    var maxAttempts = opts.maxAttempts || 4;
    var body = JSON.stringify(opts.payload);

    var lastError = 'network';
    var networkFailures = 0;

    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        var wait = backoffDelay(attempt - 1, rand);
        await sleep(lastError === 'rate_limited' ? wait * 2 : wait);
      }
      var res;
      try {
        res = await fetchImpl(opts.url, { method: 'POST', body: body, redirect: 'follow' });
      } catch (_) {
        networkFailures++;
        lastError = 'network';
        continue;
      }
      if (!res.ok) {
        lastError = 'http_' + res.status;
        continue;
      }
      var data;
      try {
        data = await res.json();
      } catch (_) {
        lastError = 'bad_response';
        continue;
      }
      if (data && data.status === 'ok') {
        return { ok: true, confirmed: true, duplicate: !!data.duplicate };
      }
      var code = (data && data.code) || 'unknown';
      if (PERMANENT_ERRORS.indexOf(code) !== -1) {
        return { ok: false, error: code, permanent: true };
      }
      lastError = code;
    }

    var allowNoCors =
      typeof opts.allowNoCors === 'function' ? opts.allowNoCors() : opts.allowNoCors !== false;
    if (networkFailures === maxAttempts && !allowNoCors) {
      return { ok: false, error: 'network' };
    }
    if (networkFailures === maxAttempts) {
      try {
        await fetchImpl(opts.url, { method: 'POST', body: body, mode: 'no-cors', redirect: 'follow' });
        return { ok: true, confirmed: false };
      } catch (_) {
        return { ok: false, error: 'network' };
      }
    }
    return { ok: false, error: lastError };
  }

  return {
    MAX_NAME_LENGTH: MAX_NAME_LENGTH,
    PERMANENT_ERRORS: PERMANENT_ERRORS,
    sanitizeName: sanitizeName,
    makeShotId: makeShotId,
    fitWithin: fitWithin,
    formatStamp: formatStamp,
    backoffDelay: backoffDelay,
    applyFilmLook: applyFilmLook,
    uploadShot: uploadShot,
  };
});
