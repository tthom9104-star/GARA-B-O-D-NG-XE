'use strict';
/* ===== PHÂN QUYỀN PHÍA SERVER =====
   Đây là lớp bảo vệ thật sự: dù ai đó sửa code trên trình duyệt thì server vẫn kiểm tra lại
   từng thay đổi theo vai trò (admin, rec, tech, cus) và theo quyền sở hữu dữ liệu. */
const { hash } = require('./auth');

class HttpError extends Error { constructor(s, m) { super(m); this.status = s; } }
const E = (s, m) => { throw new HttpError(s, m); };
const ROLES = ['admin', 'rec', 'tech', 'cus'];
const STATUS = ['received', 'quoted', 'approved', 'working', 'done', 'paid'];
const COLS = ['users', 'svc', 'parts', 'veh', 'orders', 'appts', 'notifs', 'logs', 'settings'];
const ID = /^[A-Za-z0-9_-]{1,40}$/;

/* ---------- tiện ích so sánh / kiểm tra ---------- */
const stable = x => x && typeof x == 'object' ? Array.isArray(x) ? '[' + x.map(stable).join(',') + ']' : '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}' : JSON.stringify(x);
const same = (a, b) => stable(a) === stable(b);
const strip = d => { const { _v, ...r } = d; return r; };
const diffKeys = (o, n) => { const ks = new Set([...Object.keys(o), ...Object.keys(n)]); ks.delete('_v'); return [...ks].filter(k => !same(o[k], n[k])); };
const num = (x, min = 0, max = 1e12) => typeof x == 'number' && isFinite(x) && x >= min && x <= max;
const str = (x, max = 200, min = 0) => typeof x == 'string' && x.trim().length >= min && x.length <= max;
const only = (keys, allowed, msg) => { if (keys.some(k => !allowed.includes(k))) E(403, msg || 'Bạn không có quyền sửa các trường này'); };
const logPrefix = (o, n) => { if (!Array.isArray(n.log) || n.log.length < o.log.length || n.log.length - o.log.length > 10 || !same(n.log.slice(0, o.log.length), o.log)) E(403, 'Không được sửa nhật ký cũ'); };
const sanitizeUser = (u, admin) => { const r = { id: u.id, name: u.name, role: u.role, phone: u.phone || '', _v: u._v }; if (admin) r.user = u.user; return r; };
const mine = (n, u) => n.to === u.id || n.to === 'role:' + u.role;
const ownsVeh = (st, u, vid) => { const v = st.get('veh', vid); return !!v && !!u.phone && v.phone === u.phone; };

/* ---------- ĐỌC: mỗi vai trò chỉ nhận phần dữ liệu của mình ---------- */
function readScope(st, u) {
  const L = c => st.list(c), r = u.role, admin = r === 'admin';
  const users = L('users').map(x => sanitizeUser(x, admin));
  const out = { settings: st.get('settings', 'main') || { id: 'main' }, notifs: L('notifs').filter(n => mine(n, u)), users: r === 'cus' ? users.filter(x => x.id === u.id || x.role !== 'cus') : users, svc: [], parts: [], veh: [], orders: [], appts: [], logs: [] };
  if (admin || r === 'rec') { out.svc = L('svc'); out.parts = L('parts'); out.veh = L('veh'); out.orders = L('orders'); out.appts = L('appts'); }
  if (admin) out.logs = L('logs').sort((a, b) => b.t - a.t);
  if (r === 'tech') { out.veh = L('veh'); out.orders = L('orders'); }
  if (r === 'cus') { out.veh = L('veh').filter(v => v.phone === u.phone); const ids = out.veh.map(v => v.id); out.orders = L('orders').filter(o => ids.includes(o.vid)); out.appts = L('appts').filter(a => ids.includes(a.vid)); }
  out.notifs.sort((a, b) => b.t - a.t);
  return out;
}
const outDoc = (col, d, u) => col === 'users' ? sanitizeUser(d, u.role === 'admin') : d;

/* ---------- GHI: quy tắc theo từng bộ sưu tập ---------- */
const RULES = {
  users(u, old, nu, st, ctx) {
    if (!str(nu.name, 80, 1)) E(400, 'Họ tên không hợp lệ');
    const clean = {}, uniq = name => { if (st.list('users').some(x => x.id !== nu.id && String(x.user).toLowerCase() === name.toLowerCase())) E(400, 'Tên đăng nhập đã tồn tại'); };
    if (u.role === 'admin') {
      if (!ROLES.includes(nu.role)) E(400, 'Vai trò không hợp lệ');
      if (!str(nu.user, 40, 3) || /\s/.test(nu.user)) E(400, 'Tên đăng nhập cần 3-40 ký tự, không có khoảng trắng');
      if (nu.role === 'cus' && !str(nu.phone, 20, 5)) E(400, 'Khách hàng cần có số điện thoại');
      if (old && old.id === u.id && nu.role !== old.role) E(403, 'Không thể tự đổi vai trò của chính mình');
      uniq(nu.user); Object.assign(clean, { id: nu.id, name: nu.name.trim(), user: nu.user.trim(), role: nu.role, phone: (nu.phone || '').trim() });
    } else if (u.role === 'rec' && !old) {
      if (nu.role !== 'cus') E(403, 'Lễ tân chỉ được tạo tài khoản khách hàng');
      if (!str(nu.phone, 20, 5) || !str(nu.user, 40, 3)) E(400, 'Thiếu số điện thoại hoặc tên đăng nhập');
      uniq(nu.user); Object.assign(clean, { id: nu.id, name: nu.name.trim(), user: nu.user.trim(), role: 'cus', phone: nu.phone.trim() });
    } else if (old && old.id === u.id) {
      if (nu.role !== old.role || (nu.phone || '') !== (old.phone || '') || (nu.user !== undefined && nu.user !== old.user)) E(403, 'Bạn chỉ được đổi tên hoặc mật khẩu của chính mình');
      Object.assign(clean, { id: old.id, name: nu.name.trim(), user: old.user, role: old.role, phone: old.phone || '' });
    } else E(403, 'Bạn không có quyền với tài khoản này');
    clean.ph = old ? old.ph : undefined;
    if (nu.pw !== undefined && nu.pw !== '') { if (!str(nu.pw, 100, 3)) E(400, 'Mật khẩu cần ít nhất 3 ký tự'); clean.ph = hash(nu.pw); ctx.pw.push(nu.id); }
    if (!clean.ph) E(400, 'Cần đặt mật khẩu cho tài khoản mới');
    if (!clean.phone) delete clean.phone;
    return clean;
  },
  svc(u, old, nu) {
    if (u.role !== 'admin') E(403, 'Chỉ quản trị viên được sửa danh mục dịch vụ');
    if (!str(nu.name, 120, 1) || !num(nu.hrs, 0, 100) || !num(nu.price)) E(400, 'Dịch vụ không hợp lệ');
    return { id: nu.id, name: nu.name.trim(), hrs: nu.hrs, price: nu.price };
  },
  parts(u, old, nu) {
    if (u.role === 'rec' && old) { // lễ tân chỉ được trừ/cập nhật tồn kho khi thanh toán
      only(diffKeys(old, nu), ['stock'], 'Lễ tân chỉ được cập nhật tồn kho'); if (!num(nu.stock, 0, 1e6)) E(400, 'Tồn kho không hợp lệ'); return { ...strip(old), stock: nu.stock };
    }
    if (u.role !== 'admin') E(403, 'Chỉ quản trị viên được sửa danh mục phụ tùng');
    if (!str(nu.name, 120, 1) || !num(nu.price) || !num(nu.stock, 0, 1e6) || !num(nu.min, 0, 1e6)) E(400, 'Phụ tùng không hợp lệ');
    return { id: nu.id, name: nu.name.trim(), price: nu.price, stock: nu.stock, min: nu.min };
  },
  veh(u, old, nu, st) {
    if (u.role !== 'admin' && u.role !== 'rec') E(403, 'Bạn không có quyền sửa hồ sơ xe');
    if (!str(nu.plate, 20, 3) || !str(nu.model, 80, 1) || !str(nu.owner, 80, 1) || !str(nu.phone, 20, 5) || !num(nu.km, 0, 5e6)) E(400, 'Hồ sơ xe không hợp lệ');
    const plate = nu.plate.trim().toUpperCase();
    if (st.list('veh').some(x => x.id !== nu.id && x.plate === plate)) E(400, 'Biển số này đã có hồ sơ');
    const r = { id: nu.id, plate, model: nu.model.trim(), owner: nu.owner.trim(), phone: nu.phone.trim(), km: nu.km };
    if (nu.nextDate) { if (!/^\d{4}-\d{2}-\d{2}$/.test(nu.nextDate)) E(400, 'Ngày không hợp lệ'); r.nextDate = nu.nextDate; }
    if (nu.nextKm != null) { if (!num(nu.nextKm, 0, 5e6)) E(400, 'Số km không hợp lệ'); r.nextKm = nu.nextKm; }
    return r;
  },
  orders(u, old, nu, st) {
    const arrs = () => { if (!['tasks', 'issues', 'log', 'quotes'].every(k => Array.isArray(nu[k]))) E(400, 'Dữ liệu phiếu không hợp lệ'); };
    if (u.role === 'admin' || u.role === 'rec') {
      if (!STATUS.includes(nu.status) || !st.get('veh', nu.vid)) E(400, 'Phiếu không hợp lệ (trạng thái hoặc xe)');
      arrs(); if (!(nu.chosen === null || Number.isInteger(nu.chosen) && nu.quotes[nu.chosen])) E(400, 'Phiên bản báo giá đã chọn không hợp lệ');
      if (!num(nu.disc || 0, 0, 100) || !num(nu.vat == null ? 0 : nu.vat, 0, 100) || !num(nu.km, 0, 5e6)) E(400, 'Giá trị giảm giá, VAT hoặc số km không hợp lệ');
      if (old) nu.no = old.no;
      else { if (nu.status !== 'received') E(400, 'Phiếu mới phải ở trạng thái tiếp nhận'); const n = st.meta('seq', 1); st.setMeta('seq', n + 1); nu.no = 'PT-' + String(n).padStart(4, '0'); }
      return nu;
    }
    if (!old) E(403, 'Bạn không được tạo phiếu');
    if (u.role === 'tech') {
      if (old.tech !== u.id || old.status !== 'working') E(403, 'Bạn chỉ được cập nhật phiếu đang được giao cho mình');
      only(diffKeys(old, nu), ['tasks', 'issues', 'log', 'status']); arrs(); logPrefix(old, nu);
      if (nu.status !== old.status && nu.status !== 'done') E(403, 'Thợ chỉ được chuyển phiếu sang trạng thái hoàn tất');
      return nu;
    }
    if (u.role === 'cus') {
      if (!ownsVeh(st, u, old.vid)) E(403, 'Đây không phải xe của bạn');
      if (old.status !== 'quoted') E(403, 'Phiếu này không ở bước chờ duyệt báo giá');
      only(diffKeys(old, nu), ['status', 'chosen', 'note', 'log']); logPrefix(old, nu);
      if (nu.status === 'approved') { if (!Number.isInteger(nu.chosen) || !old.quotes[nu.chosen] || !old.quotes[nu.chosen].items.length) E(400, 'Phiên bản báo giá không hợp lệ'); }
      else if (nu.status === 'received') { if (nu.chosen !== old.chosen) E(403, 'Không hợp lệ'); if (!str(nu.note, 500)) E(400, 'Nội dung yêu cầu quá dài'); }
      else E(403, 'Khách chỉ được duyệt hoặc yêu cầu chỉnh sửa báo giá');
      return nu;
    }
    E(403, 'Không đủ quyền');
  },
  appts(u, old, nu, st) {
    const okShape = () => { if (!st.get('veh', nu.vid) || !/^\d{4}-\d{2}-\d{2}$/.test(nu.date) || !/^\d{2}:\d{2}$/.test(nu.time) || !str(nu.note, 300) || !['new', 'confirmed', 'done', 'cancel'].includes(nu.status)) E(400, 'Lịch hẹn không hợp lệ'); };
    const r = { id: nu.id, vid: nu.vid, date: nu.date, time: nu.time, note: nu.note, status: nu.status };
    if (u.role === 'admin' || u.role === 'rec') { okShape(); return r; }
    if (u.role === 'cus') {
      okShape(); if (!ownsVeh(st, u, nu.vid)) E(403, 'Đây không phải xe của bạn');
      if (!old) { if (nu.status !== 'new') E(403, 'Lịch hẹn mới phải ở trạng thái chờ xác nhận'); return r; }
      only(diffKeys(old, nu), ['status']); if (nu.status !== 'cancel' || !['new', 'confirmed'].includes(old.status)) E(403, 'Khách chỉ được hủy lịch hẹn chưa diễn ra'); return r;
    }
    E(403, 'Bạn không có quyền với lịch hẹn');
  },
  notifs(u, old, nu, st) {
    if (!old) {
      if (!str(nu.txt, 300, 1) || !(/^role:(admin|rec|tech|cus)$/.test(nu.to) || st.get('users', nu.to))) E(400, 'Thông báo không hợp lệ');
      return { id: nu.id, to: nu.to, txt: nu.txt, t: Date.now(), seen: [] };
    }
    if (!mine(old, u)) E(403, 'Đây không phải thông báo của bạn');
    only(diffKeys(old, nu), ['seen']);
    if (!Array.isArray(nu.seen) || nu.seen.some(x => typeof x != 'string' || (x !== u.id && !old.seen.includes(x)))) E(403, 'Chỉ được đánh dấu đã đọc cho chính mình');
    return { ...strip(old), seen: [...new Set([...old.seen, ...nu.seen])] };
  },
  logs(u, old, nu) {
    if (old) E(403, 'Không được sửa nhật ký'); if (!str(nu.txt, 300, 1)) E(400, 'Nhật ký không hợp lệ');
    return { id: nu.id, t: Date.now(), u: u.name, txt: nu.txt };
  },
  settings(u, old, nu) {
    if (u.role !== 'admin') E(403, 'Chỉ quản trị viên được đổi cài đặt'); if (nu.id !== 'main' || !str(nu.name, 120, 1) || !str(nu.addr || '', 200) || !str(nu.phone || '', 40) || !num(nu.vat, 0, 100)) E(400, 'Cài đặt không hợp lệ');
    return { id: 'main', name: nu.name.trim(), addr: nu.addr || '', phone: nu.phone || '', vat: nu.vat };
  }
};

function remove(st, u, col, id, old, ctx) {
  if (!old) return { changed: false, key: col + ':' + id };
  if (u.role !== 'admin' || !['users', 'svc', 'parts'].includes(col)) E(403, 'Bạn không có quyền xóa dữ liệu này');
  if (col === 'users') {
    if (id === u.id) E(403, 'Không thể xóa chính mình');
    if (old.role === 'admin' && st.list('users').filter(x => x.role === 'admin').length < 2) E(403, 'Phải còn ít nhất một quản trị viên');
    ctx.dropSessions.push(id);
  }
  st.del(col, id); return { changed: true, key: col + ':' + id };
}

/* Áp dụng một thay đổi {col, id, doc}. doc = null nghĩa là xóa. */
function apply(st, u, ch, ctx) {
  const { col, id, doc } = ch || {};
  if (!COLS.includes(col)) E(400, 'Loại dữ liệu không hợp lệ');
  if (typeof id !== 'string' || !ID.test(id)) E(400, 'Mã dữ liệu không hợp lệ');
  const old = st.get(col, id);
  if (doc === null) { const r = remove(st, u, col, id, old, ctx); return { deleted: true, ...r }; }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc) || doc.id !== id) E(400, 'Dữ liệu không hợp lệ');
  if (old && doc._v !== old._v) E(409, 'Dữ liệu vừa được người khác cập nhật. Hệ thống đã tải lại, vui lòng thao tác lại.');
  if (!old && doc._v != null) E(409, 'Dữ liệu không còn tồn tại. Hệ thống đã tải lại.');
  const nu = RULES[col](u, old, { ...strip(doc) }, st, ctx);
  if (old && same(strip(old), nu)) return { changed: false, out: outDoc(col, old, u) };
  const v = old ? old._v + 1 : 1; st.put(col, id, nu, v);
  return { changed: true, out: outDoc(col, { ...nu, _v: v }, u) };
}

/* Dọn bớt thông báo và nhật ký cũ */
function prune(st) {
  [['notifs', 300], ['logs', 400]].forEach(([c, max]) => { if (st.count(c) > max) st.list(c).sort((a, b) => (b.t || 0) - (a.t || 0)).slice(max).forEach(d => st.del(c, d.id)); });
}
module.exports = { HttpError, E, readScope, apply, prune, sanitizeUser };