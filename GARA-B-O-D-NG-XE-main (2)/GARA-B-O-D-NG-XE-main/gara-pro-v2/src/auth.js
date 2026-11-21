'use strict';
/* ===== XÁC THỰC: băm mật khẩu (scrypt), phiên đăng nhập, chống dò mật khẩu ===== */
const crypto = require('crypto');
const SESSION_MS = 7 * 24 * 3600 * 1000;

const hash = pw => { const s = crypto.randomBytes(16); return s.toString('hex') + ':' + crypto.scryptSync(String(pw), s, 32).toString('hex'); };
function verify(pw, h) {
  if (!h) return false; const [s, k] = h.split(':'); if (!s || !k) return false;
  const d = crypto.scryptSync(String(pw), Buffer.from(s, 'hex'), 32), kb = Buffer.from(k, 'hex');
  return d.length === kb.length && crypto.timingSafeEqual(d, kb);
}
function newSession(store, uid) {
  const t = crypto.randomBytes(24).toString('hex'); store.sessionPut(t, uid, Date.now() + SESSION_MS); store.sessionClean(); return t;
}
/* Sai quá 5 lần trong 5 phút thì khóa tạm (theo IP + tên đăng nhập) */
const tries = new Map();
function limited(key) { const r = tries.get(key); return !!r && r.n >= 5 && Date.now() - r.t < 300000; }
function fail(key) { const r = tries.get(key), now = Date.now(); if (!r || now - r.t > 300000) tries.set(key, { n: 1, t: now }); else { r.n++; r.t = now; } }
const ok = key => tries.delete(key);

module.exports = { hash, verify, newSession, limited, fail, ok };