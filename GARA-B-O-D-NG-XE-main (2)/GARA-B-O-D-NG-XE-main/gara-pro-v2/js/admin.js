/* ===== QUẢN TRỊ VIÊN: tổng quan, tài khoản, danh mục & kho, báo cáo, nhật ký, cài đặt ===== */
function aDash() {
  const paid = D.orders.filter(o => o.status == 'paid'), td = iso(), mo = td.slice(0, 7);
  const sum = f => paid.filter(f).reduce((a, o) => a + tot(o), 0);
  const act = D.orders.filter(o => o.status != 'paid'), low = D.parts.filter(p => p.stock <= p.min);
  const days = []; for (let i = 13; i >= 0; i--) { const d = iso(-i); days.push({ l: d.slice(8), v: sum(o => o.paidAt == d) }); }
  const col = ['#94a3b8', '#c77d00', '#6d4fc2', '#2f6bb0', '#ffc21a'];
  const sc = ['received', 'quoted', 'approved', 'working', 'done'].map((s, i) => ({ l: ST[s][0], v: D.orders.filter(o => o.status == s).length, c: col[i] }));
  const m = {}; paid.forEach(o => o.quotes[o.chosen].items.filter(i => i.t == 's').forEach(i => m[i.name] = (m[i.name] || 0) + i.qty));
  const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top.length ? top[0][1] : 1;
  return hd('Tổng quan', `Xin chào ${esc(me.name)}, đây là tình hình gara hôm nay`) +
    `<div class="grid g4">${kpi('dollar', 'Doanh thu hôm nay', fm(sum(o => o.paidAt == td)), '', 'green')}${kpi('chart', 'Doanh thu tháng này', fm(sum(o => o.paidAt.startsWith(mo))), paid.filter(o => o.paidAt.startsWith(mo)).length + ' xe hoàn tất', 'blue')}${kpi('car', 'Xe đang trong xưởng', act.length, '', 'orange')}${kpi('box', 'Phụ tùng sắp hết', low.length, 'Cần nhập thêm', 'red')}</div>
  <div class="cols mt"><div class="card"><h3>Doanh thu 14 ngày gần nhất</h3>${bars(days, 1)}</div>
  <div class="card"><h3>Xe đang xử lý</h3><div class="row" style="flex-wrap:nowrap">${donut(sc)}<div class="leg">${sc.map(x => `<div><i style="background:${x.c}"></i>${x.l}: <b>${x.v}</b></div>`).join('')}</div></div></div></div>
  <div class="grid g3 mt"><div class="card"><h3>Dịch vụ được dùng nhiều</h3>${top.map(([n, c]) => `<div style="margin-bottom:10px"><div class="row sp sm"><span>${esc(n)}</span><b>${c}</b></div><div class="bar"><i style="width:${c / mx * 100}%"></i></div></div>`).join('') || empty('Chưa có dữ liệu')}</div>
  <div class="card"><h3>Kho cần nhập thêm</h3>${low.map(p => `<div class="li" onclick="go('catalog');S.tab='parts';R()"><span>${esc(p.name)}</span><span class="badge err">Còn ${p.stock}</span></div>`).join('') || empty('Kho đủ hàng', 'check')}</div>
  <div class="card"><h3>Hoạt động gần đây</h3><div class="log">${D.logs.slice(0, 6).map(l => `<div><b>${esc(l.u)}</b>: ${esc(l.txt)} <span class="xs">${hm(l.t)}</span></div>`).join('')}</div></div></div>`;
}

/* ----- Tài khoản ----- */
function aUsers() {
  const q = S.q.toLowerCase(), l = D.users.filter(u => !S.rf || S.rf == 'all' || u.role == S.rf).filter(u => (u.name + u.user).toLowerCase().includes(q));
  const rc = { admin: 'err', rec: 'blue', tech: 'violet', cus: '' };
  return hd('Tài khoản & phân quyền', 'Thêm, sửa, xóa tài khoản và phân quyền cho nhân viên, thợ, lễ tân', `<button class="btn" onclick="uForm()">${ic('plus', 16)} Thêm tài khoản</button>`) +
    `<div class="seg">${[['all', 'Tất cả'], ...Object.entries(ROLE)].map(([k, n]) => `<button class="${S.rf == k ? 'on' : ''}" onclick="S.rf='${k}';R()">${n}</button>`).join('')}</div>
  <div class="toolbar"><div class="search">${ic('search', 16)}<input id="qs" placeholder="Tìm theo tên hoặc tên đăng nhập" value="${esc(S.q)}" oninput="S.q=this.value;R('qs')"></div></div>
  <div class="card tw"><table><tr><th>Họ tên</th><th>Đăng nhập</th><th>Vai trò</th><th>SĐT</th><th></th></tr>${l.map(u => `<tr><td><div class="row gap"><div class="avatar">${esc(u.name.trim().split(' ').pop()[0] || '?')}</div>${esc(u.name)}</div></td><td>${esc(u.user)}</td><td><span class="badge ${rc[u.role]}">${ROLE[u.role]}</span></td><td>${esc(u.phone || '')}</td>
  <td class="r"><button class="icon" title="Sửa" onclick="${A('uForm', u.id)}">${ic('edit', 16)}</button><button class="icon" title="Đặt lại mật khẩu" onclick="${A('uReset', u.id)}">${ic('key', 16)}</button>${u.id != me.id ? `<button class="icon dng" title="Xóa" onclick="${A('uDel', u.id)}">${ic('trash', 16)}</button>` : ''}</td></tr>`).join('')}</table></div>`;
}
function uForm(id) {
  const u = D.users.find(x => x.id == id) || {};
  form(id ? 'Sửa tài khoản' : 'Thêm tài khoản', [{ k: 'name', l: 'Họ tên', v: u.name, req: 1 }, { k: 'user', l: 'Tên đăng nhập', v: u.user, req: 1 }, { k: 'pw', l: 'Mật khẩu', v: u.pw, req: 1 }, { k: 'role', l: 'Phân quyền', v: u.role || 'tech', o: Object.entries(ROLE) }, { k: 'phone', l: 'Số điện thoại (bắt buộc với khách hàng)', v: u.phone }], r => {
    if (D.users.some(x => x.user == r.user && x.id != id)) { toast('Tên đăng nhập đã tồn tại', 'err'); return false; }
    if (r.role == 'cus' && !r.phone.trim()) { toast('Khách hàng cần có số điện thoại', 'err'); return false; }
    if (id) Object.assign(u, r); else D.users.push({ id: uid(), ...r });
    logA((id ? 'Cập nhật' : 'Tạo') + ' tài khoản ' + r.user); toast('Đã lưu tài khoản');
  });
}
function uReset(id) { const u = D.users.find(x => x.id == id); ask(`Đặt lại mật khẩu của <b>${esc(u.name)}</b> về <b>123456</b>?`, () => { u.pw = '123456'; logA('Đặt lại mật khẩu ' + u.user); toast('Đã đặt lại mật khẩu'); }); }
function uDel(id) { const u = D.users.find(x => x.id == id); ask(`Xóa tài khoản <b>${esc(u.name)}</b>?`, () => { D.users = D.users.filter(x => x.id != id); logA('Xóa tài khoản ' + u.user); toast('Đã xóa tài khoản'); }, 'Xóa', 1); }

/* ----- Danh mục & kho ----- */
function aCatalog() {
  const isS = S.tab == 'svc';
  return hd('Danh mục & kho', 'Cấu hình dịch vụ, định mức công chuẩn và phụ tùng', `<button class="btn" onclick="${A('cForm', S.tab)}">${ic('plus', 16)} Thêm ${isS ? 'dịch vụ' : 'phụ tùng'}</button>`) +
    `<div class="seg"><button class="${isS ? 'on' : ''}" onclick="S.tab='svc';R()">Dịch vụ</button><button class="${!isS ? 'on' : ''}" onclick="S.tab='parts';R()">Phụ tùng & tồn kho</button></div>
  <div class="card tw"><table><tr><th>Tên</th>${isS ? '<th>Công chuẩn</th>' : '<th>Tồn kho</th><th>Mức tối thiểu</th>'}<th class="r">Giá</th><th></th></tr>${D[S.tab].map(x => `<tr><td>${esc(x.name)}</td>${isS ? `<td>${x.hrs} giờ</td>` : `<td style="min-width:150px"><div class="row gap"><b>${x.stock}</b>${x.stock <= x.min ? '<span class="badge err">Sắp hết</span>' : ''}</div></td><td>${x.min}</td>`}<td class="r">${fm(x.price)}</td>
  <td class="r">${isS ? '' : `<button class="btn ghost sm" onclick="${A('stockIn', x.id)}">Nhập kho</button>`}<button class="icon" onclick="${A('cForm', S.tab, x.id)}" title="Sửa">${ic('edit', 16)}</button><button class="icon dng" onclick="${A('cDel', S.tab, x.id)}" title="Xóa">${ic('trash', 16)}</button></td></tr>`).join('')}</table></div>`;
}
function cForm(k, id) {
  const x = D[k].find(a => a.id == id) || {};
  form(id ? 'Sửa danh mục' : 'Thêm danh mục', [{ k: 'name', l: 'Tên', v: x.name, req: 1 }, ...(k == 'svc' ? [{ k: 'hrs', l: 'Định mức công chuẩn (giờ)', t: 'number', step: '0.1', min: 0, v: x.hrs }] : [{ k: 'stock', l: 'Tồn kho', t: 'number', min: 0, v: x.stock == null ? 0 : x.stock }, { k: 'min', l: 'Mức tồn tối thiểu', t: 'number', min: 0, v: x.min == null ? 5 : x.min }]), { k: 'price', l: 'Giá (VNĐ)', t: 'number', min: 0, v: x.price, req: 1 }], r => {
    ['price', 'hrs', 'stock', 'min'].forEach(f => { if (r[f] != null) r[f] = +r[f] || 0; });
    if (id) Object.assign(x, r); else D[k].push({ id: uid(), ...r });
    logA('Cập nhật danh mục: ' + r.name); toast('Đã lưu');
  });
}
function cDel(k, id) { const x = D[k].find(a => a.id == id); ask(`Xóa <b>${esc(x.name)}</b> khỏi danh mục? (Báo giá đã lập không bị ảnh hưởng)`, () => { D[k] = D[k].filter(a => a.id != id); toast('Đã xóa'); }, 'Xóa', 1); }
function stockIn(id) { const p = D.parts.find(x => x.id == id); form('Nhập kho: ' + esc(p.name), [{ k: 'n', l: 'Số lượng nhập', t: 'number', min: 1, v: 10, req: 1 }], r => { p.stock += Math.max(0, +r.n || 0); logA(`Nhập kho ${p.name} +${r.n}`); toast('Đã nhập kho'); }, 'Nhập kho'); }

/* ----- Báo cáo ----- */
function aReport() {
  const g = S.rg, paid = D.orders.filter(o => o.status == 'paid'), key = g == 'day' ? s => s : g == 'month' ? s => s.slice(0, 7) : s => s.slice(0, 4), per = [];
  if (g == 'day') for (let i = 13; i >= 0; i--) per.push(iso(-i));
  else if (g == 'month') for (let i = 11; i >= 0; i--) { const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() - i); per.push(ym(x)); }
  else { const y = new Date().getFullYear(); for (let i = 3; i >= 0; i--) per.push('' + (y - i)); }
  const rows = per.map(p => { const L = paid.filter(o => key(o.paidAt) == p); return { p, n: L.length, v: L.reduce((a, o) => a + tot(o), 0) }; });
  const inR = paid.filter(o => per.includes(key(o.paidAt))), rev = inR.reduce((a, o) => a + tot(o), 0);
  let act = 0, stdH = 0; const tc = {}, sv = {};
  inR.forEach(o => {
    const t = tc[o.tech] = tc[o.tech] || { n: 0, a: 0, s: 0 }; t.n++;
    o.tasks.forEach(k => { const h = hh(k); act += h; stdH += k.std || 0; t.a += h; t.s += k.std || 0; });
    o.quotes[o.chosen].items.filter(i => i.t == 's').forEach(i => { const z = sv[i.name] = sv[i.name] || { q: 0, v: 0 }; z.q += i.qty; z.v += i.qty * i.price; });
  });
  const lbl = p => g == 'day' ? p.slice(8) + '/' + p.slice(5, 7) : g == 'month' ? 'T' + p.slice(5) : p;
  const gl = { day: 'ngày', month: 'tháng', year: 'năm' }[g];
  return hd('Báo cáo doanh thu & thống kê', 'Theo dõi hoạt động của gara theo ngày, tháng, năm', `<button class="btn ghost" onclick="rptCsv()">${ic('download', 16)} Xuất CSV</button>`) +
    `<div class="seg">${[['day', 'Theo ngày'], ['month', 'Theo tháng'], ['year', 'Theo năm']].map(a => `<button class="${g == a[0] ? 'on' : ''}" onclick="S.rg='${a[0]}';R()">${a[1]}</button>`).join('')}</div>
  <div class="grid g4">${kpi('dollar', 'Tổng doanh thu', fm(rev), '', 'green')}${kpi('car', 'Số xe hoàn tất', inR.length, '', 'blue')}${kpi('chart', 'Trung bình mỗi xe', fm(inR.length ? rev / inR.length : 0), '', 'orange')}${kpi('clock', 'Giờ công thực tế', act.toFixed(1) + 'h', 'Định mức ' + stdH.toFixed(1) + 'h', 'violet')}</div>
  <div class="card mt"><h3>Doanh thu theo ${gl}</h3>${bars(rows.map(r => ({ l: lbl(r.p), v: r.v })), 1)}</div>
  <div class="cols mt"><div class="card tw"><h3>Chi tiết theo ${gl}</h3><table><tr><th>Kỳ</th><th class="r">Số xe</th><th class="r">Doanh thu</th></tr>${rows.slice().reverse().map(r => `<tr><td>${g == 'day' ? dmy(r.p) : r.p}</td><td class="r">${r.n}</td><td class="r">${fm(r.v)}</td></tr>`).join('')}</table></div>
  <div class="card tw"><h3>Hiệu suất thợ</h3><table><tr><th>Thợ</th><th class="r">Xe</th><th class="r">Thực tế</th><th class="r">Định mức</th></tr>${Object.entries(tc).map(([id, t]) => `<tr><td>${esc(UN(id))}</td><td class="r">${t.n}</td><td class="r">${t.a.toFixed(1)}h</td><td class="r">${t.s.toFixed(1)}h</td></tr>`).join('') || '<tr><td colspan="4" class="mut">Chưa có dữ liệu</td></tr>'}</table></div></div>
  <div class="card tw mt"><h3>Doanh thu theo dịch vụ</h3><table><tr><th>Dịch vụ</th><th class="r">Số lượt</th><th class="r">Doanh thu</th></tr>${Object.entries(sv).sort((a, b) => b[1].v - a[1].v).map(([n, z]) => `<tr><td>${esc(n)}</td><td class="r">${z.q}</td><td class="r">${fm(z.v)}</td></tr>`).join('')}</table></div>`;
}
function rptCsv() {
  const g = S.rg, paid = D.orders.filter(o => o.status == 'paid'), key = g == 'day' ? s => s : g == 'month' ? s => s.slice(0, 7) : s => s.slice(0, 4), m = {};
  paid.forEach(o => { const k = key(o.paidAt); m[k] = m[k] || { n: 0, v: 0 }; m[k].n++; m[k].v += tot(o); });
  csv('bao-cao-' + g + '.csv', [['Kỳ', 'Số xe', 'Doanh thu (VNĐ)'], ...Object.keys(m).sort().map(k => [k, m[k].n, Math.round(m[k].v)])]); toast('Đã xuất file CSV');
}

/* ----- Nhật ký & cài đặt ----- */
function aLogs() {
  return hd('Nhật ký hoạt động', 'Các thao tác gần đây trong hệ thống') + `<div class="card tw"><table><tr><th>Thời gian</th><th>Người dùng</th><th>Thao tác</th></tr>${D.logs.map(l => `<tr><td>${hm(l.t)}</td><td>${esc(l.u)}</td><td style="white-space:normal">${esc(l.txt)}</td></tr>`).join('')}</table></div>`;
}
function aSettings() {
  const s = D.settings;
  return hd('Cài đặt', 'Thông tin gara hiển thị trên báo giá và hóa đơn') + `<div class="grid g2"><div class="card"><h3>Thông tin gara</h3>
  <label class="fl">Tên gara</label><input id="sn" value="${esc(s.name)}"><label class="fl">Địa chỉ</label><input id="sa" value="${esc(s.addr)}"><label class="fl">Điện thoại</label><input id="sp" value="${esc(s.phone)}"><label class="fl">Thuế VAT mặc định (%)</label><input id="sv" type="number" min="0" max="100" value="${s.vat}">
  <div class="row end mt"><button class="btn" onclick="setSave()">Lưu cài đặt</button></div></div>
  <div class="card"><h3>Dữ liệu</h3><p class="mut sm">Dữ liệu được lưu ngay trên trình duyệt này. Bạn có thể sao lưu ra file hoặc khôi phục dữ liệu mẫu để chạy thử lại.</p>
  <div class="row gap mt"><button class="btn ghost" onclick="backup()">${ic('download', 16)} Sao lưu JSON</button><button class="btn dng" onclick="resetData()">Khôi phục dữ liệu mẫu</button></div></div></div>`;
}
function setSave() { const s = D.settings; s.name = $('#sn').value.trim() || s.name; s.addr = $('#sa').value; s.phone = $('#sp').value; s.vat = Math.min(100, Math.max(0, +$('#sv').value || 0)); logA('Cập nhật cài đặt gara'); save(); toast('Đã lưu cài đặt'); }
function backup() { const b = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gara-backup-' + iso() + '.json'; a.click(); }
function resetData() { ask('Toàn bộ dữ liệu hiện tại sẽ bị thay bằng dữ liệu mẫu. Tiếp tục?', () => { D = seed(); me = null; try { localStorage.removeItem('gara_me'); } catch (e) { } S.view = ''; save(); toast('Đã khôi phục dữ liệu mẫu'); }, 'Khôi phục', 1); }
