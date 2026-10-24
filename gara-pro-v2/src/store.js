'use strict';
/* ===== LƯU TRỮ DỮ LIỆU =====
   Mặc định dùng SQLite có sẵn trong Node (module node:sqlite, cần Node >= 22.13).
   Nếu Node cũ hơn, tự chuyển sang lưu file JSON để vẫn chạy được.
   Mọi dữ liệu nghiệp vụ lưu dạng tài liệu JSON trong bảng docs(col, id, v, data):
   col = tên bộ sưu tập (users, orders...), v = số phiên bản (để chống ghi đè khi 2 người sửa cùng lúc). */
const fs = require('fs'), path = require('path');

function sqliteStore(file) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS docs(col TEXT NOT NULL,id TEXT NOT NULL,v INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(col,id));
    CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY,val TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,uid TEXT NOT NULL,exp INTEGER NOT NULL);`);
  const P = {
    list: db.prepare('SELECT v,data FROM docs WHERE col=?'), get: db.prepare('SELECT v,data FROM docs WHERE col=? AND id=?'),
    put: db.prepare('INSERT INTO docs(col,id,v,data) VALUES(?,?,?,?) ON CONFLICT(col,id) DO UPDATE SET v=excluded.v,data=excluded.data'),
    del: db.prepare('DELETE FROM docs WHERE col=? AND id=?'), clear: db.prepare('DELETE FROM docs'), count: db.prepare('SELECT COUNT(*) n FROM docs WHERE col=?'),
    mget: db.prepare('SELECT val FROM meta WHERE k=?'), mset: db.prepare('INSERT INTO meta(k,val) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET val=excluded.val'),
    sput: db.prepare('INSERT INTO sessions(token,uid,exp) VALUES(?,?,?)'), sget: db.prepare('SELECT uid,exp FROM sessions WHERE token=?'), sdel: db.prepare('DELETE FROM sessions WHERE token=?'),
    sdelU: db.prepare('DELETE FROM sessions WHERE uid=?'), sdelUx: db.prepare('DELETE FROM sessions WHERE uid=? AND token<>?'), sclean: db.prepare('DELETE FROM sessions WHERE exp<?'), sclear: db.prepare('DELETE FROM sessions')
  };
  const wrap = r => r ? { ...JSON.parse(r.data), _v: r.v } : null;
  return {
    kind: 'sqlite',
    list: c => P.list.all(c).map(wrap), get: (c, id) => wrap(P.get.get(c, id)), count: c => P.count.get(c).n,
    put(c, id, doc, v) { const { _v, ...d } = doc; P.put.run(c, id, v, JSON.stringify(d)); }, del: (c, id) => { P.del.run(c, id); }, clear() { P.clear.run(); },
    meta(k, def) { const r = P.mget.get(k); return r ? JSON.parse(r.val) : def; }, setMeta(k, v) { P.mset.run(k, JSON.stringify(v)); },
    sessionPut: (t, uid, exp) => { P.sput.run(t, uid, exp); }, sessionGet: t => P.sget.get(t) || null, sessionDel: t => { P.sdel.run(t); },
    sessionDelUser: (uid, except) => { except ? P.sdelUx.run(uid, except) : P.sdelU.run(uid); }, sessionClean: () => { P.sclean.run(Date.now()); }, sessionClear: () => { P.sclear.run(); },
    tx(fn) { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } }
  };
}

function jsonStore(file) {
  let st = { docs: {}, meta: {}, sessions: {} };
  try { st = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { }
  let timer = null;
  const flush = () => { timer = null; const t = file + '.tmp'; fs.writeFileSync(t, JSON.stringify(st)); fs.renameSync(t, file); };
  const dirty = () => { if (!timer) timer = setTimeout(flush, 30); };
  const col = c => st.docs[c] || (st.docs[c] = {});
  const wrap = r => r ? { ...JSON.parse(r.data), _v: r.v } : null;
  return {
    kind: 'json',
    list: c => Object.values(col(c)).map(wrap), get: (c, id) => wrap(col(c)[id]), count: c => Object.keys(col(c)).length,
    put(c, id, doc, v) { const { _v, ...d } = doc; col(c)[id] = { v, data: JSON.stringify(d) }; dirty(); }, del(c, id) { delete col(c)[id]; dirty(); }, clear() { st.docs = {}; dirty(); },
    meta: (k, def) => k in st.meta ? st.meta[k] : def, setMeta(k, v) { st.meta[k] = v; dirty(); },
    sessionPut(t, uid, exp) { st.sessions[t] = { uid, exp }; dirty(); }, sessionGet: t => st.sessions[t] || null, sessionDel(t) { delete st.sessions[t]; dirty(); },
    sessionDelUser(uid, except) { for (const t in st.sessions) if (st.sessions[t].uid == uid && t != except) delete st.sessions[t]; dirty(); },
    sessionClean() { for (const t in st.sessions) if (st.sessions[t].exp < Date.now()) delete st.sessions[t]; dirty(); }, sessionClear() { st.sessions = {}; dirty(); },
    tx(fn) { const snap = JSON.stringify(st); try { return fn(); } catch (e) { st = JSON.parse(snap); throw e; } }
  };
}

function openStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  if (process.env.GARA_STORE !== 'json') {
    try { return sqliteStore(path.join(dir, 'gara.db')); }
    catch (e) { console.warn('[!] Không dùng được SQLite (' + e.message + '). Chuyển sang lưu file JSON.'); }
  }
  return jsonStore(path.join(dir, 'gara.json'));
}
module.exports = { openStore };