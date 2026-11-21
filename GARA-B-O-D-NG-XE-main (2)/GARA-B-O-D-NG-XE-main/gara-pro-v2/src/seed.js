'use strict';
/* ===== DỮ LIỆU MẪU: tạo khi chạy lần đầu hoặc khi admin bấm "Khôi phục dữ liệu mẫu" ===== */
const { hash } = require('./auth');
const p2 = n => String(n).padStart(2, '0');
const lc = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const iso = (n = 0) => { const d = new Date(); d.setDate(d.getDate() + n); return lc(d); };
const dmy = s => s.split('-').reverse().join('/');
const QN = ['Tiết kiệm', 'Tiêu chuẩn', 'Cao cấp'];

function build() {
  let r = 11; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const d = {
    settings: [{ id: 'main', name: 'Gara Pro Auto Service', addr: '123 Nguyễn Văn Linh, Quận 7, TP.HCM', phone: '028 3999 8888', vat: 8 }], seq: 1,
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
  d.logs = [{ id: 'l1', t: now - 5e6, u: 'Hệ thống', txt: 'Khởi tạo dữ liệu mẫu' }];
  return d;
}

/* Ghi dữ liệu mẫu vào store (mật khẩu được băm, không lưu dạng chữ thường) */
function load(store) {
  const d = build();
  store.tx(() => {
    store.clear(); store.sessionClear();
    for (const col of ['settings', 'users', 'svc', 'parts', 'veh', 'orders', 'appts', 'notifs', 'logs'])
      for (const x of d[col]) { const doc = { ...x }; if (col == 'users') { doc.ph = hash(doc.pw); delete doc.pw; } store.put(col, doc.id, doc, 1); }
    store.setMeta('seq', d.seq); store.setMeta('rev', store.meta('rev', 0) + 1);
  });
}
module.exports = { load };