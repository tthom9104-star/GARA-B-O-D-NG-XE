'use strict';
/* ===== GARA PRO - MÁY CHỦ =====
   Chạy:  node server.js        (hoặc npm start)
   Mở:    http://localhost:3000
   Không cần cài thư viện nào. Dữ liệu nằm trong thư mục data/ */
const http = require('http'), fs = require('fs'), path = require('path');
const { openStore } = require('./src/store');
const auth = require('./src/auth');
const policy = require('./src/policy');
const seed = require('./src/seed');

const PORT = +process.env.PORT || 3000;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUB = path.join(__dirname, 'public');
const store = openStore(DATA);
if (!store.count('users')) { seed.load(store); console.log('Đã tạo dữ liệu mẫu lần đầu.'); }
const { HttpError, E } = policy;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const send = (res, code, body, headers = {}) => { const b = typeof body == 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body); res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(b); };
function readBody(req) {
  return new Promise((ok, no) => {
    let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > 2e6) { no(new HttpError(413, 'Dữ liệu gửi lên quá lớn')); req.destroy(); } else ch.push(c); });
    req.on('end', () => { if (!ch.length) return ok({}); try { ok(JSON.parse(Buffer.concat(ch).toString('utf8'))); } catch (e) { no(new HttpError(400, 'JSON không hợp lệ')); } });
    req.on('error', no);
  });
}
function authed(req) {
  const m = /^Bearer ([a-f0-9]{48})$/.exec(req.headers.authorization || ''); if (!m) E(401, 'Chưa đăng nhập');
  const s = store.sessionGet(m[1]); if (!s || s.exp < Date.now()) E(401, 'Phiên đăng nhập đã hết hạn');
  const user = store.get('users', s.uid); if (!user) E(401, 'Tài khoản không còn tồn tại');
  return { user, token: m[1] };
}
const rev = () => store.meta('rev', 1);

const ROUTES = {
  'POST /api/login': async (req, res) => {
    const b = await readBody(req), name = String(b.user || '').trim().toLowerCase(), key = (req.socket.remoteAddress || '') + '|' + name;
    if (auth.limited(key)) E(429, 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút.');
    const u = store.list('users').find(x => String(x.user).toLowerCase() === name);
    if (!u || !auth.verify(b.pw, u.ph)) { auth.fail(key); E(401, 'Sai tên đăng nhập hoặc mật khẩu'); }
    auth.ok(key); send(res, 200, { token: auth.newSession(store, u.id) });
  },
  'POST /api/logout': async (req, res) => { const { token } = authed(req); store.sessionDel(token); send(res, 200, { ok: true }); },
  'GET /api/rev': async (req, res) => { authed(req); send(res, 200, { rev: rev() }); },
  'GET /api/state': async (req, res) => { const { user } = authed(req); send(res, 200, { rev: rev(), me: user.id, data: policy.readScope(store, user) }); },
  'POST /api/sync': async (req, res) => {
    const { user, token } = authed(req), b = await readBody(req);
    if (!Array.isArray(b.changes) || b.changes.length > 300) E(400, 'Danh sách thay đổi không hợp lệ');
    const ctx = { pw: [], dropSessions: [] };
    const r = store.tx(() => {
      const applied = [], deleted = []; let changed = false;
      for (const ch of b.changes) { const x = policy.apply(store, user, ch, ctx); changed = changed || x.changed; if (x.deleted) deleted.push(x.key); else applied.push({ col: ch.col, id: ch.id, doc: x.out }); }
      if (changed) { policy.prune(store); store.setMeta('rev', rev() + 1); }
      return { applied, deleted };
    });
    ctx.pw.forEach(id => store.sessionDelUser(id, id === user.id ? token : null));
    ctx.dropSessions.forEach(id => store.sessionDelUser(id));
    send(res, 200, { ...r, rev: rev() });
  },
  'POST /api/reset': async (req, res) => { const { user } = authed(req); if (user.role !== 'admin') E(403, 'Chỉ quản trị viên được khôi phục dữ liệu'); seed.load(store); send(res, 200, { ok: true }); }
};

function cors(req, res) { const o = req.headers.origin; if (o && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Vary', 'Origin'); } }
function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB + path.sep) && f !== PUB) return send(res, 403, { error: 'Forbidden' });
  fs.readFile(f, (e, d) => {
    if (e) return send(res, 404, { error: 'Không tìm thấy' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }); res.end(d);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) {
      cors(req, res); if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
      const h = ROUTES[req.method + ' ' + url.pathname]; if (!h) return send(res, 404, { error: 'Không có API này' });
      return await h(req, res);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    serveStatic(req, res);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e); send(res, 500, { error: 'Lỗi máy chủ' });
  }
});
if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`\n  Gara Pro đang chạy (${store.kind}): http://localhost:${PORT}`);
    if (HOST === '0.0.0.0') console.log('  Chế độ mạng LAN: mở bằng địa chỉ IP của máy này từ điện thoại, ví dụ http://192.168.1.10:' + PORT);
    console.log('  Tài khoản thử: admin/admin, letan/123, tho/123, khach/123\n');
  });
}
module.exports = { server, store };