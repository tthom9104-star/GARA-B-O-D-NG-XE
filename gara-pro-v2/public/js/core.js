/* ===== CORE: tiện ích, icon, lưu trữ, dữ liệu mẫu, popup, biểu đồ ===== */
const KEY = 'gara_v2';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const p2 = n => String(n).padStart(2, '0');
const lc = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const ym = d => lc(d).slice(0, 7);
const iso = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return lc(d); };
const dmy = s => s ? s.split('-').reverse().join('/') : '';
const hm = t => new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const fm = n => Math.round(+n || 0).toLocaleString('vi-VN') + 'đ';
const short = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'tr' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n));
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// A('hàm', 'id', 5) => hàm('id',5) dùng cho onclick
const A = (f, ...a) => f + '(' + a.map(x => typeof x == 'string' ? "'" + x + "'" : x).join(',') + ')';

/* ---------- Icon ---------- */
const IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7M18.5 14c2 .7 3 2.5 3 5"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
  car: '<path d="M5 17h14M3 13l2-6h14l2 6v4H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  bell: '<path d="M6 17V11a6 6 0 1112 0v6l2 2H4z"/><path d="M10 21h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  check: '<path d="M5 12l5 5L20 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  printer: '<path d="M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  dollar: '<path d="M12 2v20M17 6.5C16 5.5 14.3 5 12.5 5 9.9 5 8 6.3 8 8.3s1.8 3 4.5 3.7 4.5 1.7 4.5 3.7S15 19 12.5 19c-2 0-3.8-.6-5-1.8"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h0"/>', history: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.7 3M3 4v4h4M12 8v4l3 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>'
};
const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

/* ---------- Hằng số ---------- */
const ROLE = { admin: 'Quản trị viên', rec: 'Lễ tân', tech: 'Thợ kỹ thuật', cus: 'Khách hàng' };
const ST = { received: ['Đã tiếp nhận', ''], quoted: ['Chờ khách duyệt', 'warn'], approved: ['Chờ giao việc', 'violet'], working: ['Đang sửa chữa', 'blue'], done: ['Chờ thanh toán', 'orange'], paid: ['Đã thanh toán', 'ok'] };
const STEPS = ['received', 'quoted', 'approved', 'working', 'done', 'paid'];
const QN = ['Tiết kiệm', 'Tiêu chuẩn', 'Cao cấp'];

/* ---------- Dữ liệu mẫu ---------- */
function seed() {
  let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const d = {
    settings: { name: 'Gara Pro Auto Service', addr: '123 Nguyễn Văn Linh, Quận 7, TP.HCM', phone: '028 3999 8888', vat: 8 }, seq: 1,
    users: [
      { id: 'u1', name: 'Quản trị viên', user: 'admin', pw: 'admin', role: 'admin' },
      { id: 'u2', name: 'Lan (Lễ tân)', user: 'letan', pw: '123', role: 'rec' },
      { id: 'u3', name: 'Thợ Hùng', user: 'tho', pw: '123', role: 'tech' },
      { id: 'u4', name: 'Thợ Minh', user: 'tho2', pw: '123', role: 'tech' },
      { id: 'u5', name: 'Nguyễn Văn A', user: 'khach', pw: '123', role: 'cus', phone: '0900000001' }],
    svc: [
      { id: 's1', name: 'Thay dầu động cơ', hrs: .5, price: 150000 }, { id: 's2', name: 'Kiểm tra hệ thống phanh', hrs: .5, price: 100000 },
      { id: 's3', name: 'Thay má phanh trước', hrs: 1, price: 250000 }, { id: 's4', name: 'Thay lọc gió', hrs: .3, price: 50000 },
      { id: 's5', name: 'Thay bugi', hrs: .8, price: 200000 }, { id: 's6', name: 'Cân chỉnh thước lái', hrs: 1.5, price: 450000 },
      { id: 's7', name: 'Vệ sinh kim phun', hrs: 1.2, price: 600000 }, { id: 's8', name: 'Kiểm tra tổng quát', hrs: .7, price: 120000 }],
    parts: [
      { id: 'p1', name: 'Nhớt tổng hợp 4L', price: 650000, stock: 20, min: 6 }, { id: 'p2', name: 'Nhớt bán tổng hợp 4L', price: 450000, stock: 25, min: 6 },
      { id: 'p3', name: 'Lọc dầu', price: 90000, stock: 40, min: 10 }, { id: 'p4', name: 'Má phanh trước', price: 520000, stock: 8, min: 5 },
      { id: 'p5', name: 'Lọc gió', price: 150000, stock: 15, min: 5 }, { id: 'p6', name: 'Bugi Iridium', price: 180000, stock: 3, min: 8 },
      { id: 'p7', name: 'Nước làm mát 1L', price: 120000, stock: 30, min: 8 }, { id: 'p8', name: 'Dầu phanh DOT4', price: 110000, stock: 12, min: 4 }],
    veh: [
      { id: 'v1', plate: '30A-123.45', model: 'Toyota Vios 2019', owner: 'Nguyễn Văn A', phone: '0900000001', km: 42000, nextDate: iso(10), nextKm: 45000 },
      { id: 'v2', plate: '51H-678.90', model: 'Honda CR-V 2021', owner: 'Nguyễn Văn A', phone: '0900000001', km: 25500, nextDate: iso(60), nextKm: 30000 },
      { id: 'v3', plate: '29B-456.78', model: 'Mazda 3 2020', owner: 'Trần Thị B', phone: '0911111111', km: 38000, nextDate: iso(45), nextKm: 43000 },
      { id: 'v4', plate: '59C-111.22', model: 'Hyundai Accent 2018', owner: 'Lê Văn C', phone: '0922222222', km: 61000, nextDate: iso(20), nextKm: 65000 },
      { id: 'v5', plate: '51K-333.44', model: 'Kia Seltos 2022', owner: 'Phạm Thị D', phone: '0933333333', km: 15000, nextDate: iso(90), nextKm: 20000 },
      { id: 'v6', plate: '30G-999.88', model: 'Ford Ranger 2020', owner: 'Đặng Văn E', phone: '0944444444', km: 72000, nextDate: iso(30), nextKm: 77000 }],
    orders: [], appts: [], notifs: [], logs: []
  };
  [['Trần Thị B', '0911111111'], ['Lê Văn C', '0922222222'], ['Phạm Thị D', '0933333333'], ['Đặng Văn E', '0944444444']]
    .forEach((c, i) => d.users.push({ id: 'c' + i, name: c[0], user: c[1], pw: '123456', role: 'cus', phone: c[1] }));
  const it = (t, id, q = 1) => { const x = (t == 's' ? d.svc : d.parts).find(a => a.id == id); return { t, id, name: x.name, qty: q, price: x.price }; };
  const mkT = (items, done) => items.filter(i => i.t == 's').map(i => { const s = d.svc.find(a => a.id == i.id); return { name: i.name, std: s.hrs, sec: done ? Math.round(s.hrs * 3600 * (.8 + rnd() * .5)) : 0, run: null, done: !!done }; });
  const base = o => Object.assign({ disc: 0, vat: 8, issues: [], log: [], tech: null, chosen: null, tasks: [], note: '' }, o);
  const PK = [['Thay dầu & lọc dầu', [['s', 's1'], ['p', 'p2'], ['p', 'p3']]], ['Thay má phanh', [['s', 's2'], ['s', 's3'], ['p', 'p4']]],
  ['Bảo dưỡng lớn', [['s', 's1'], ['p', 'p1'], ['p', 'p3'], ['s', 's4'], ['p', 'p5'], ['s', 's5'], ['p', 'p6', 4]]], ['Cân chỉnh & kiểm tra', [['s', 's6'], ['s', 's8']]]];
  const H = [];
  for (let i = 0; i < 80; i++) {
    const v = d.veh[Math.floor(rnd() * 5)], pk = PK[Math.floor(rnd() * 4)], day = -Math.floor(Math.pow(rnd(), 1.6) * 360) - 1, dt = iso(day), items = pk[1].map(a => it(a[0], a[1], a[2] || 1));
    H.push(base({ vid: v.id, km: Math.max(1000, v.km + day * 35), req: pk[0], status: 'paid', date: dt, paidAt: dt, pay: ['Tiền mặt', 'Chuyển khoản', 'Thẻ'][Math.floor(rnd() * 3)], tech: rnd() < .5 ? 'u3' : 'u4', quotes: [{ name: 'Tiêu chuẩn', items }], chosen: 0, tasks: mkT(items, 1) }));
  }
  H.sort((a, b) => a.date.localeCompare(b.date));
  const add = o => { o.id = 'o' + d.seq; o.no = 'PT-' + String(d.seq++).padStart(4, '0'); d.orders.push(o); return o; };
  H.forEach(add);
  const Q3 = (a, b, c) => [{ name: QN[0], items: a }, { name: QN[1], items: b }, { name: QN[2], items: c }];
  const eco = [it('s', 's1'), it('p', 'p2'), it('p', 'p3')], std = [it('s', 's1'), it('p', 'p1'), it('p', 'p3'), it('s', 's4'), it('p', 'p5')], pre = [...std, it('s', 's5'), it('p', 'p6', 4), it('s', 's8')];
  const now = Date.now();
  add(base({ vid: 'v4', km: 61000, req: 'Vô lăng rung khi chạy trên 80 km/h', status: 'received', date: iso(), quotes: Q3([], [], []), log: [{ t: now - 3e6, txt: 'Lễ tân tiếp nhận xe' }] }));
  add(base({ vid: 'v2', km: 25500, req: 'Bảo dưỡng định kỳ 25.000 km', status: 'quoted', date: iso(-1), quotes: Q3(eco, std, pre), log: [{ t: now - 9e7, txt: 'Lễ tân tiếp nhận xe' }, { t: now - 8e7, txt: 'Đã gửi báo giá cho khách' }] }));
  add(base({ vid: 'v5', km: 15000, req: 'Thay dầu và kiểm tra tổng quát', status: 'approved', date: iso(-1), quotes: Q3(eco, std, pre), chosen: 1, log: [{ t: now - 9e7, txt: 'Lễ tân tiếp nhận xe' }, { t: now - 6e7, txt: 'Khách duyệt bản Tiêu chuẩn' }] }));
  const w = add(base({ vid: 'v6', km: 72000, req: 'Bảo dưỡng 70.000 km', status: 'working', date: iso(-2), quotes: Q3(eco, std, pre), chosen: 2, tech: 'u3', log: [{ t: now - 17e7, txt: 'Lễ tân tiếp nhận xe' }, { t: now - 1e8, txt: 'Khách duyệt bản Cao cấp' }, { t: now - 5e7, txt: 'Giao việc cho Thợ Hùng' }] }));
  w.tasks = mkT(pre, 0); w.tasks[0].done = true; w.tasks[0].sec = 2000;
  const dn = add(base({ vid: 'v3', km: 38000, req: 'Thay dầu & lọc dầu', status: 'done', date: iso(-1), quotes: Q3(eco, eco, eco), chosen: 0, tech: 'u4', log: [{ t: now - 9e7, txt: 'Lễ tân tiếp nhận xe' }, { t: now - 3e6, txt: 'Thợ Minh hoàn tất công việc' }] }));
  dn.tasks = mkT(eco, 1);
  d.appts = [{ id: 'a1', vid: 'v1', date: iso(2), time: '09:00', note: 'Bảo dưỡng định kỳ 45.000 km', status: 'new' }, { id: 'a2', vid: 'v3', date: iso(1), time: '14:00', note: 'Kiểm tra phanh', status: 'confirmed' }];
  d.notifs = [
    { id: 'n1', to: 'role:rec', txt: 'Lịch hẹn mới: Nguyễn Văn A (30A-123.45) ngày ' + dmy(iso(2)), t: now - 36e5, seen: [] },
    { id: 'n2', to: 'u5', txt: 'Gara đã gửi báo giá cho xe 51H-678.90. Vui lòng xem và duyệt.', t: now - 8e7, seen: [] },
    { id: 'n3', to: 'u3', txt: 'Bạn được giao xe 30G-999.88 (Bảo dưỡng 70.000 km)', t: now - 5e7, seen: [] }];
  d.logs = [{ t: now - 5e6, u: 'Hệ thống', txt: 'Khởi tạo dữ liệu mẫu' }];
  return d;
}

/* ---------- Lưu trữ & trạng thái ---------- */
let D; try { D = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
if (!D || !D.orders) D = seed();
let me = null; try { me = D.users.find(u => u.id == localStorage.getItem('gara_me')) || null; } catch (e) { }
const S = { view: '', sel: null, q: '', rg: 'day', qv: 1, tab: 'svc', pop: null, rf: 'all' };
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } }
function theme(t) { try { if (t) localStorage.setItem('gara_th', t); } catch (e) { } let v = 'light'; try { v = localStorage.getItem('gara_th') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); } catch (e) { } document.documentElement.dataset.theme = v; return v; }
theme();

/* ---------- Truy vấn & nghiệp vụ dùng chung ---------- */
const V = id => D.veh.find(v => v.id == id), O = id => D.orders.find(o => o.id == id);
const UN = id => (D.users.find(u => u.id == id) || {}).name || '—';
const custOf = v => D.users.find(u => u.role == 'cus' && u.phone == v.phone);
const stockOf = i => { const p = D.parts.find(x => x.id == i.id); return p ? p.stock : 0; };
const vatOf = o => o.vat == null ? D.settings.vat : o.vat;
function calc(o, items) {
  const s = (items || (o.chosen == null ? [] : o.quotes[o.chosen].items)).reduce((a, i) => a + i.qty * i.price, 0), dc = s * (o.disc || 0) / 100, v = (s - dc) * vatOf(o) / 100;
  return { s, d: dc, v, t: s - dc + v };
}
const tot = o => calc(o).t;
const sec = t => (t.sec || 0) + (t.run ? Math.floor((Date.now() - t.run) / 1000) : 0);
const hh = t => sec(t) / 3600;
const fmT = s => `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s % 3600 / 60))}:${p2(s % 60)}`;
function notify(to, txt) { D.notifs.unshift({ id: uid(), to, txt, t: Date.now(), seen: [] }); D.notifs.length = Math.min(D.notifs.length, 80); }
function notifyCus(o, txt) { const c = custOf(V(o.vid)); if (c) notify(c.id, txt); }
function logA(txt) { D.logs.unshift({ id: uid(), t: Date.now(), u: me ? me.name : 'Hệ thống', txt }); D.logs.length = Math.min(D.logs.length, 200); }
function ev(o, txt) { o.log.push({ t: Date.now(), txt }); }
function newOrder(vid, km, req) {
  const v = V(vid); v.km = Math.max(v.km, km);
  const o = { id: 'o' + uid(), no: 'PT-' + String(D.seq++).padStart(4, '0'), vid, km, req, status: 'received', date: iso(), quotes: QN.map(n => ({ name: n, items: [] })), chosen: null, disc: 0, vat: D.settings.vat, tasks: [], issues: [], tech: null, note: '', log: [{ t: Date.now(), txt: 'Lễ tân tiếp nhận xe' }] };
  D.orders.push(o); logA('Tiếp nhận xe ' + v.plate); return o;
}
function go(v) { S.view = v; S.sel = null; S.q = ''; S.pop = null; R(); scrollTo(0, 0); }

/* ---------- Popup, form, toast ---------- */
function modal(h, w) {
  const o = document.createElement('div'); o.className = 'ov'; o.innerHTML = `<div class="modal${w ? ' wide' : ''}" role="dialog">${h}</div>`;
  o.onmousedown = e => { if (e.target === o) o.remove(); }; document.body.appendChild(o); return o;
}
function form(title, fs, ok, btn) {
  const o = modal(`<div class="mh"><h3>${title}</h3><button class="icon" data-x aria-label="Đóng">${ic('x')}</button></div><div class="mb">${fs.map(f => `<label class="fl">${f.l}${f.req ? ' *' : ''}</label>` + (f.o ? `<select name="${f.k}">${f.o.map(x => `<option value="${esc(x[0])}"${x[0] == f.v ? ' selected' : ''}>${esc(x[1])}</option>`).join('')}</select>` : f.t == 'textarea' ? `<textarea name="${f.k}" rows="3" placeholder="${esc(f.ph)}">${esc(f.v)}</textarea>` : `<input name="${f.k}" type="${f.t || 'text'}" value="${esc(f.v)}" placeholder="${esc(f.ph)}"${f.step ? ` step="${f.step}"` : ''}${f.min != null ? ` min="${f.min}"` : ''}>`)).join('')}</div><div class="mf"><button class="btn ghost" data-x>Hủy</button><button class="btn" id="fok">${btn || 'Lưu thay đổi'}</button></div>`);
  $$('[data-x]', o).forEach(b => b.onclick = () => o.remove());
  const f1 = $('input,select,textarea', o); if (f1) f1.focus();
  $('#fok', o).onclick = () => {
    const r = {}; for (const f of fs) { r[f.k] = $(`[name=${f.k}]`, o).value; if (f.req && !String(r[f.k]).trim()) return toast('Vui lòng nhập: ' + f.l, 'err'); }
    if (ok(r) === false) return; o.remove(); save(); R();
  };
}
function ask(msg, cb, btn, danger) {
  const o = modal(`<div class="mh"><h3>Xác nhận</h3></div><div class="mb"><p class="mut">${msg}</p></div><div class="mf"><button class="btn ghost" data-x>Hủy</button><button class="btn ${danger ? 'dng' : ''}" id="fok">${btn || 'Đồng ý'}</button></div>`);
  $$('[data-x]', o).forEach(b => b.onclick = () => o.remove());
  $('#fok', o).onclick = () => { if (cb() === false) return; o.remove(); save(); R(); };
}
function toast(m, t) {
  let c = $('#toasts'); if (!c) { c = document.createElement('div'); c.id = 'toasts'; document.body.appendChild(c); }
  const e = document.createElement('div'); e.className = 'toast ' + (t || ''); e.innerHTML = ic(t == 'err' ? 'alert' : 'check', 16) + `<span>${esc(m)}</span>`; c.appendChild(e);
  setTimeout(() => e.classList.add('out'), 2800); setTimeout(() => e.remove(), 3200);
}
function printDoc(h) { let p = $('#printArea'); if (!p) { p = document.createElement('div'); p.id = 'printArea'; document.body.appendChild(p); } p.innerHTML = h; setTimeout(() => window.print(), 60); }
function csv(name, rows) {
  const b = new Blob(['\ufeff' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

/* ---------- Biểu đồ SVG ---------- */
function bars(data, every = 1) {
  const n = data.length, W = n * 46, mx = Math.max(1, ...data.map(x => x.v));
  return `<svg class="bars" viewBox="0 0 ${W} 210" role="img"><line x1="0" y1="178" x2="${W}" y2="178" stroke="var(--line)"/>` + data.map((x, i) => {
    const h = Math.round(x.v / mx * 140), X = i * 46 + 9;
    return `<rect x="${X}" y="${178 - h}" width="28" height="${h}" rx="4" fill="${i == n - 1 ? 'var(--acc)' : 'var(--blue)'}" opacity="${x.v ? 1 : .15}"><title>${esc(x.l)}: ${fm(x.v)}</title></rect>` +
      (x.v ? `<text x="${X + 14}" y="${172 - h}" text-anchor="middle" font-size="10" fill="var(--mut)">${short(x.v)}</text>` : '') +
      (i % every == 0 ? `<text x="${X + 14}" y="196" text-anchor="middle" font-size="11" fill="var(--mut)">${esc(x.l)}</text>` : '');
  }).join('') + '</svg>';
}
function donut(data) {
  const t = data.reduce((a, x) => a + x.v, 0), T = t || 1; let off = 25;
  const seg = data.map(x => { const p = x.v / T * 100, s = `<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${x.c}" stroke-width="5" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${off}"/>`; off -= p; return s; }).join('');
  return `<svg class="donut" viewBox="0 0 42 42" role="img"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--grayb)" stroke-width="5"/>${seg}<text x="21" y="23.5" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor">${t}</text></svg>`;
}
