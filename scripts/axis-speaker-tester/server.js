#!/usr/bin/env node
'use strict';
/*
 * AXIS speaker API tester - local proxy + static server.
 *
 * Why a proxy is needed: AXIS devices return no CORS headers and VAPIX uses HTTP
 * Digest auth, so a browser page cannot call them directly. This forwards the
 * request from Node (which can do Digest) and hands the raw response back.
 *
 * Zero dependencies. Binds to 127.0.0.1 unless told otherwise.
 *   node server.js                  -> http://127.0.0.1:8099
 *   PORT=9000 node server.js
 *   BIND=0.0.0.0 node server.js     -> reachable from other machines; only do
 *                                      this on a trusted LAN, since anyone who
 *                                      can reach it can drive the proxy.
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8099);
const BIND = process.env.BIND || '127.0.0.1';
const ROOT = __dirname;
const MAX_BODY = 8 * 1024 * 1024;

/* ---------------------------------------------------------------- digest --- */

function hashHex(algorithm, input) {
  const algo = /sha-?256/i.test(algorithm || '') ? 'sha256' : 'md5';
  return crypto.createHash(algo).update(input, 'utf8').digest('hex');
}

// Pulls the Digest challenge out of a WWW-Authenticate header that may also
// advertise Basic/Negotiate alongside it.
function parseDigestChallenge(header) {
  if (!header) return null;
  const start = header.search(/\bDigest\b/i);
  if (start < 0) return null;
  let scope = header.slice(start + 'Digest'.length);
  const nextScheme = scope.search(/,\s*(Basic|Negotiate|NTLM)\b/i);
  if (nextScheme >= 0) scope = scope.slice(0, nextScheme);
  const out = {};
  const pair = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|([^,\s]+))/g;
  let m;
  while ((m = pair.exec(scope)) !== null) {
    out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  }
  return out;
}

function hasBasicChallenge(header) {
  return !!header && /(^|,)\s*Basic\b/i.test(header);
}

function basicHeader(username, password) {
  return 'Basic ' + Buffer.from(username + ':' + password, 'utf8').toString('base64');
}

function digestHeader(challenge, opts) {
  const algorithm = challenge.algorithm || 'MD5';
  const isSess = /-sess$/i.test(algorithm);
  const cnonce = crypto.randomBytes(8).toString('hex');
  const nc = '00000001';

  let qop = null;
  if (challenge.qop) {
    const offered = challenge.qop.split(',').map((s) => s.trim().toLowerCase());
    qop = offered.includes('auth') ? 'auth' : offered.includes('auth-int') ? 'auth-int' : offered[0];
  }

  let ha1 = hashHex(algorithm, opts.username + ':' + (challenge.realm || '') + ':' + opts.password);
  if (isSess) ha1 = hashHex(algorithm, ha1 + ':' + challenge.nonce + ':' + cnonce);

  const ha2 = qop === 'auth-int'
    ? hashHex(algorithm, opts.method + ':' + opts.uri + ':' + hashHex(algorithm, opts.body || ''))
    : hashHex(algorithm, opts.method + ':' + opts.uri);

  const response = qop
    ? hashHex(algorithm, [ha1, challenge.nonce, nc, cnonce, qop, ha2].join(':'))
    : hashHex(algorithm, [ha1, challenge.nonce, ha2].join(':'));

  const parts = [
    'username="' + opts.username + '"',
    'realm="' + (challenge.realm || '') + '"',
    'nonce="' + (challenge.nonce || '') + '"',
    'uri="' + opts.uri + '"',
    'response="' + response + '"',
  ];
  if (challenge.algorithm) parts.push('algorithm=' + challenge.algorithm);
  if (challenge.opaque !== undefined) parts.push('opaque="' + challenge.opaque + '"');
  if (qop) parts.push('qop=' + qop, 'nc=' + nc, 'cnonce="' + cnonce + '"');
  return 'Digest ' + parts.join(', ');
}

/* --------------------------------------------------------------- request --- */

function sendOnce(options, bodyBuf, timeoutMs) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (d) => {
        size += d.length;
        if (size <= MAX_BODY) chunks.push(d);
      });
      res.on('end', () => resolve({
        status: res.statusCode,
        statusText: res.statusMessage || '',
        headers: res.headers,
        buf: Buffer.concat(chunks),
        truncated: size > MAX_BODY,
      }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Timed out after ' + timeoutMs + ' ms (no response from device)'));
    });
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function decode(res) {
  const ct = String(res.headers['content-type'] || '');
  if (/^(image|audio|video|application\/octet-stream)/i.test(ct)) {
    return { body: res.buf.toString('base64'), encoding: 'base64' };
  }
  return { body: res.buf.toString('utf8'), encoding: 'utf8' };
}

async function proxyRequest(cfg) {
  const scheme = cfg.scheme === 'https' ? 'https:' : 'http:';
  const port = Number(cfg.port) || (scheme === 'https:' ? 443 : 80);
  const method = String(cfg.method || 'GET').toUpperCase();
  const raw = String(cfg.path || '/');
  const reqPath = raw.startsWith('/') ? raw : '/' + raw;
  const timeoutMs = Number(cfg.timeoutMs) || 15000;
  const authMode = cfg.authMode || 'auto';
  const bodyStr = cfg.body == null || cfg.body === '' ? null : String(cfg.body);
  const bodyBuf = bodyStr === null ? null : Buffer.from(bodyStr, 'utf8');
  const attempts = [];

  const buildOptions = (authHeader, buf) => {
    const headers = Object.assign({ Accept: '*/*' }, cfg.headers || {});
    if (buf) headers['Content-Length'] = String(buf.length);
    else if (/^(POST|PUT|PATCH)$/.test(method)) headers['Content-Length'] = '0';
    if (authHeader) headers['Authorization'] = authHeader;
    return {
      protocol: scheme,
      hostname: cfg.host,
      port: port,
      path: reqPath,
      method: method,
      headers: headers,
      agent: false,
      rejectUnauthorized: !cfg.insecure,
    };
  };

  const haveCreds = !!(cfg.username || cfg.password);
  const started = Date.now();

  const makeDigest = (challenge) => digestHeader(challenge, {
    username: cfg.username || '',
    password: cfg.password || '',
    method: method,
    uri: reqPath,
    body: bodyStr,
  });

  // Basic mode can authenticate immediately; no challenge round-trip needed.
  let authHeader = null;
  let authUsed = 'none';
  if (authMode === 'basic' && haveCreds) {
    authHeader = basicHeader(cfg.username || '', cfg.password || '');
    authUsed = 'basic';
  }
  const wantsChallenge = haveCreds && (authMode === 'auto' || authMode === 'digest');

  let res;
  if (wantsChallenge && bodyBuf) {
    // Harvest the challenge with a body-less probe first. Posting the payload
    // unauthenticated makes servers that answer 401 without draining the request
    // stream reset the connection mid-write, and it would submit the same
    // payload twice for no reason.
    const probe = await sendOnce(buildOptions(null, null), null, timeoutMs);
    attempts.push({ auth: 'challenge probe (no body)', status: probe.status });
    if (probe.status === 401) {
      const wwwAuth = probe.headers['www-authenticate'];
      const challenge = parseDigestChallenge(wwwAuth);
      if (challenge) {
        authHeader = makeDigest(challenge);
        authUsed = 'digest';
      } else if (hasBasicChallenge(wwwAuth) && authMode === 'auto') {
        authHeader = basicHeader(cfg.username || '', cfg.password || '');
        authUsed = 'basic';
      }
    }
    res = await sendOnce(buildOptions(authHeader, bodyBuf), bodyBuf, timeoutMs);
    attempts.push({ auth: authUsed, status: res.status });
  } else {
    res = await sendOnce(buildOptions(authHeader, bodyBuf), bodyBuf, timeoutMs);
    attempts.push({ auth: authUsed, status: res.status });

    if (res.status === 401 && wantsChallenge) {
      const wwwAuth = res.headers['www-authenticate'];
      const challenge = parseDigestChallenge(wwwAuth);
      if (challenge) {
        res = await sendOnce(buildOptions(makeDigest(challenge), bodyBuf), bodyBuf, timeoutMs);
        attempts.push({ auth: 'digest', status: res.status });
        authUsed = 'digest';
      } else if (hasBasicChallenge(wwwAuth) && authMode === 'auto') {
        res = await sendOnce(buildOptions(basicHeader(cfg.username || '', cfg.password || ''), bodyBuf), bodyBuf, timeoutMs);
        attempts.push({ auth: 'basic', status: res.status });
        authUsed = 'basic';
      }
    }
  }

  // A stale nonce earns exactly one more go.
  if (res.status === 401 && wantsChallenge) {
    const again = parseDigestChallenge(res.headers['www-authenticate']);
    if (again && String(again.stale).toLowerCase() === 'true') {
      res = await sendOnce(buildOptions(makeDigest(again), bodyBuf), bodyBuf, timeoutMs);
      attempts.push({ auth: 'digest (stale retry)', status: res.status });
    }
  }

  const decoded = decode(res);
  return {
    ok: true,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    body: decoded.body,
    encoding: decoded.encoding,
    truncated: res.truncated,
    bytes: res.buf.length,
    timeMs: Date.now() - started,
    authUsed: authUsed,
    attempts: attempts,
  };
}

/* ---------------------------------------------------------------- server --- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

function serveStatic(req, res) {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = rel === '/' ? 'index.html' : rel.replace(/^\/+/, '');
  const full = path.resolve(ROOT, file);
  if (!full.startsWith(path.resolve(ROOT))) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (d) => {
      size += d.length;
      if (size > MAX_BODY) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(d);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(new Error('Invalid JSON in proxy request: ' + e.message));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url.split('?')[0] === '/api/proxy' && req.method === 'POST') {
    let cfg;
    try {
      cfg = await readJsonBody(req);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
      return;
    }
    if (!cfg.host) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'No device host set. Fill in the Device field.' }));
      return;
    }
    try {
      const out = await proxyRequest(cfg);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message, code: e.code || null }));
    }
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, BIND, () => {
  console.log('AXIS speaker tester -> http://' + BIND + ':' + PORT);
  if (BIND !== '127.0.0.1') console.log('WARNING: bound to ' + BIND + ' - reachable from the network.');
  console.log('Ctrl+C to stop.');
});
