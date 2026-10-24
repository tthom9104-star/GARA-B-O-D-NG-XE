/* ===== LỄ TÂN: tổng quan, xe & khách, bảng phiếu tiếp nhận, báo giá, lịch hẹn, thanh toán ===== */
function openO(id) { S.view = 'orders'; S.sel = id; S.pop = null; R(); scrollTo(0, 0); }
function rDash() {
  const cnt = s => D.orders.filter(o => o.status == s).length, td = iso();
  const ap = D.appts.filter(a => a.date >= td && (a.status == 'new' || a.status == 'confirmed')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
  const todo = D.orders.filter(o => ['received', 'approved', 'done'].includes(o.status)), what = { received: 'Lập báo giá', approved: 'Giao việc cho thợ', done: 'Bàn giao & thanh toán' };
  return hd('Tổng quan', `Xin chào ${esc(me.name)}, đây là các việc cần xử lý`, `<button class="btn" onclick="go('vehicles')">${ic('plus', 16)} Tiếp nhận xe</button>`) +
    `<div class="grid g4">${kpi('clipboard', 'Chờ lập báo giá', cnt('received'), '', 'blue')}${kpi('clock', 'Chờ khách duyệt', cnt('quoted'), '', 'orange')}${kpi('wrench', 'Đang sửa chữa', cnt('working'), '', 'violet')}${kpi('dollar', 'Chờ thanh toán', cnt('done'), '', 'green')}</div>
  <div class="cols mt"><div class="card"><h3>Cần xử lý ngay</h3>${todo.map(o => `<div class="li" onclick="${A('openO', o.id)}"><div class="row gap">${plate(V(o.vid))}<span class="li-t">${what[o.status]}</span></div>${bdg(o.status)}</div>`).join('') || empty('Không có việc tồn đọng', 'check')}</div>
  <div class="card"><h3>Lịch hẹn sắp tới</h3>${ap.map(a => { const v = V(a.vid); return `<div class="li" onclick="go('appts')"><div><b>${esc(v.plate)}</b><div class="mut xs">${esc(a.note)}</div></div><div class="right sm">${dmy(a.date)}<div class="mut xs">${a.time}</div></div></div>`; }).join('') || empty('Chưa có lịch hẹn', 'calendar')}</div></div>`;
}
function rVehicles() { return hd('Xe & khách hàng', 'Tra cứu lịch sử, tạo hồ sơ xe mới và tiếp nhận xe') + vehList(0); }
function vForm() {
  form('Tạo hồ sơ xe mới', [{ k: 'plate', l: 'Biển số xe', ph: '30A-123.45', req: 1 }, { k: 'model', l: 'Hãng và đời xe', ph: 'Toyota Vios 2019', req: 1 }, { k: 'owner', l: 'Tên chủ xe', req: 1 }, { k: 'phone', l: 'Số điện thoại chủ xe', req: 1 }, { k: 'km', l: 'Số km hiện tại', t: 'number', min: 0 }], r => {
    r.plate = r.plate.trim().toUpperCase(); r.phone = r.phone.trim();
    if (D.veh.some(v => v.plate == r.plate)) { toast('Biển số này đã có hồ sơ', 'err'); return false; }
    r.km = +r.km || 0; D.veh.push({ id: 'v' + uid(), ...r });
    if (!D.users.some(u => u.phone == r.phone && u.role == 'cus')) { D.users.push({ id: uid(), name: r.owner, user: r.phone, pw: '123456', role: 'cus', phone: r.phone }); toast('Đã tạo hồ sơ xe và tài khoản khách (mật khẩu 123456)'); } else toast('Đã tạo hồ sơ xe');
    logA('Tạo hồ sơ xe ' + r.plate);
  });
}
function oForm(vid, req, aid) {
  const v = V(vid);
  form('Phiếu tiếp nhận: ' + esc(v.plate), [{ k: 'km', l: 'Số km hiện tại', t: 'number', v: v.km, min: 0, req: 1 }, { k: 'req', l: 'Yêu cầu của khách', t: 'textarea', v: req || '', ph: 'Ví dụ: Kêu lạ phần gầm, thay dầu...', req: 1 }], r => {
    const o = newOrder(vid, +r.km, r.req.trim()); if (aid) { const a = D.appts.find(x => x.id == aid); if (a) a.status = 'done'; }
    S.view = 'orders'; S.sel = o.id; toast('Đã lập phiếu ' + o.no);
  }, 'Tạo phiếu');
}

/* ----- Bảng phiếu (kanban) ----- */
function rOrders() {
  if (S.sel && O(S.sel)) return oDetail(O(S.sel));
  const cols = [['received', 'Mới tiếp nhận'], ['quoted', 'Chờ khách duyệt'], ['approved', 'Chờ giao việc'], ['working', 'Đang sửa'], ['done', 'Chờ thanh toán']];
  const card = o => { const v = V(o.vid); return `<div class="kc" onclick="${A('openO', o.id)}"><div class="row sp">${plate(v)}<span class="mut xs">${o.no}</span></div><p>${esc(o.req)}</p><div class="row sp xs mut"><span>${esc(v.model)}</span><b style="color:var(--ink)">${o.chosen != null ? fm(tot(o)) : ''}</b></div>${o.tech ? `<div class="xs mut" style="margin-top:4px">Thợ: ${esc(UN(o.tech))}</div>` : ''}</div>`; };
  const rec = D.orders.filter(o => o.status == 'paid').sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.no.localeCompare(a.no)).slice(0, 6);
  return hd('Phiếu tiếp nhận', 'Theo dõi từng xe qua các bước: tiếp nhận, báo giá, sửa chữa, thanh toán') +
    `<div class="kan">${cols.map(([s, l]) => { const L = D.orders.filter(o => o.status == s); return `<div class="kcol"><div class="kh"><b>${l}</b><span class="count">${L.length}</span></div>${L.map(card).join('') || '<div class="mut xs c" style="padding:12px">Trống</div>'}</div>`; }).join('')}</div>
  <div class="card tw mt"><h3>Đã thanh toán gần đây</h3><table><tr><th>Phiếu</th><th>Biển số</th><th>Ngày</th><th class="r">Tổng</th><th></th></tr>${rec.map(o => `<tr><td>${o.no}</td><td>${esc(V(o.vid).plate)}</td><td>${dmy(o.paidAt)}</td><td class="r">${fm(tot(o))}</td><td class="r"><button class="btn ghost sm" onclick="${A('openO', o.id)}">Xem</button></td></tr>`).join('')}</table></div>`;
}
function oDetail(o) {
  const v = V(o.vid), ed = o.status == 'received' || o.status == 'quoted';
  let h = `<div style="margin-bottom:12px"><button class="btn ghost sm" onclick="S.sel=null;R()">← Danh sách phiếu</button></div>
  <div class="card"><div class="row sp"><div>${plate(v)}<div class="mut sm" style="margin-top:6px">${esc(v.model)} - ${km(o.km)}</div></div><div class="right">${bdg(o.status)}<div class="mut xs">${o.no}</div></div></div>${stepper(o)}
  <div class="info"><div><span>Chủ xe</span>${esc(v.owner)} - ${esc(v.phone)}</div><div><span>Yêu cầu của khách</span>${esc(o.req)}</div><div><span>Thợ phụ trách</span>${o.tech ? esc(UN(o.tech)) : 'Chưa phân công'}</div></div></div>`;
  if (o.note) h += `<div class="alert mt">${ic('alert')}<div><b>Khách yêu cầu chỉnh sửa báo giá:</b> ${esc(o.note)}</div></div>`;
  if (o.issues.length) h += `<div class="alert mt">${ic('alert')}<div><b>Thợ báo lỗi phát sinh:</b>${o.issues.map(i => `<div>- ${esc(i)}</div>`).join('')}<div class="xs">Hãy cập nhật báo giá và báo khách nếu cần.</div></div></div>`;
  h += '<div class="mt"></div>';
  if (ed) h += qEditor(o);
  else if (o.chosen != null) h += `<div class="card"><div class="row sp"><h3>Phiên bản khách chọn: ${o.quotes[o.chosen].name}</h3><button class="btn ghost sm" onclick="${A('printO', o.id, o.status == 'paid' ? 'invoice' : 'quote')}">${ic('printer', 14)} In ${o.status == 'paid' ? 'hóa đơn' : 'báo giá'}</button></div><div class="tw"><table>${o.quotes[o.chosen].items.map(i => `<tr><td>${esc(i.name)}</td><td>×${i.qty}</td><td class="r">${fm(i.qty * i.price)}</td></tr>`).join('')}</table></div>${totalsBox(calc(o), o)}</div>`;
  if (o.status == 'approved') h += `<div class="card mt"><h3>Giao việc cho thợ</h3><div class="row gap"><select id="tc" style="max-width:260px">${D.users.filter(u => u.role == 'tech').map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select><button class="btn" onclick="${A('assign', o.id)}">${ic('wrench', 16)} Giao việc</button></div></div>`;
  if (o.status == 'working') h += `<div class="card mt"><h3>Tiến độ sửa chữa</h3>${progress(o)}<p class="mut sm mt">Thợ ${esc(UN(o.tech))} đang thực hiện. Phiếu sẽ chuyển sang chờ thanh toán khi thợ hoàn tất.</p></div>`;
  if (o.status == 'done') h += `<div class="card mt"><h3>Bàn giao xe và thanh toán</h3><div class="row gap"><b style="font:700 24px var(--fn)">${fm(tot(o))}</b><span class="grow"></span><select id="pm" style="max-width:170px"><option>Tiền mặt</option><option>Chuyển khoản</option><option>Thẻ</option></select><button class="btn ghost" onclick="${A('printO', o.id, 'invoice')}">${ic('printer', 16)} In hóa đơn</button><button class="btn ok" onclick="${A('pay', o.id)}">${ic('check', 16)} Xác nhận thanh toán</button></div></div>`;
  if (o.status == 'paid') h += `<div class="alert blue mt">${ic('check')}<div>Đã thanh toán ${fm(tot(o))} (${esc(o.pay)}) ngày ${dmy(o.paidAt)}. Hệ thống đã đặt lịch nhắc bảo dưỡng kế tiếp cho khách.</div></div>`;
  return h + `<div class="grid g2 mt">${orderLog(o)}<div class="card"><h3>Lịch sử bảo dưỡng của xe</h3>${hist(o.vid)}</div></div>`;
}
const progress = o => { const n = o.tasks.length, d = o.tasks.filter(t => t.done).length; return `<div class="row sp sm"><span>${d}/${n} hạng mục hoàn thành</span><b>${n ? Math.round(d / n * 100) : 0}%</b></div><div class="bar g" style="margin-top:6px"><i style="width:${n ? d / n * 100 : 0}%"></i></div>`; };

/* ----- Trình soạn báo giá nhiều phiên bản ----- */
function qEditor(o) {
  const qi = S.qv, it = o.quotes[qi].items;
  return `<div class="card"><div class="row sp"><h3>Báo giá nhiều phiên bản</h3><button class="btn ghost sm" onclick="${A('printO', o.id, 'quote', qi)}">${ic('printer', 14)} In bản này</button></div>
  <p class="mut sm" style="margin:4px 0 12px">Soạn tối đa 3 bản (tiết kiệm, tiêu chuẩn, cao cấp) để khách so sánh và chọn trước khi sửa.</p>
  <div class="seg">${o.quotes.map((x, i) => `<button class="${qi == i ? 'on' : ''}" onclick="S.qv=${i};R()">${x.name}<small>${fm(calc(o, x.items).t)}</small></button>`).join('')}</div>
  ${it.length ? `<div class="tw"><table><tr><th>Hạng mục</th><th>Loại</th><th>Số lượng</th><th class="r">Thành tiền</th><th></th></tr>${it.map((i, k) => `<tr><td>${esc(i.name)}${i.t == 'p' && stockOf(i) < i.qty ? ' <span class="badge warn">Kho không đủ</span>' : ''}</td><td><span class="chip ${i.t}">${i.t == 's' ? 'Dịch vụ' : 'Phụ tùng'}</span></td><td>${i.t == 'p' ? `<div class="qty"><button onclick="${A('qQty', o.id, k, -1)}" aria-label="Giảm">−</button><b>${i.qty}</b><button onclick="${A('qQty', o.id, k, 1)}" aria-label="Tăng">+</button></div>` : i.qty}</td><td class="r">${fm(i.qty * i.price)}</td><td class="r"><button class="icon dng" onclick="${A('qDel', o.id, k)}" aria-label="Xóa">${ic('trash', 16)}</button></td></tr>`).join('')}</table></div>` : empty('Bản này chưa có hạng mục. Hãy thêm dịch vụ hoặc phụ tùng bên dưới.', 'clipboard')}
  <div class="row gap mt"><select id="qi" class="grow" style="min-width:220px"><optgroup label="Dịch vụ">${D.svc.map(s => `<option value="s:${s.id}">${esc(s.name)} - ${fm(s.price)}</option>`).join('')}</optgroup><optgroup label="Phụ tùng">${D.parts.map(p => `<option value="p:${p.id}">${esc(p.name)} - ${fm(p.price)} (kho ${p.stock})</option>`).join('')}</optgroup></select><input id="qn" type="number" min="1" value="1" class="w70" aria-label="Số lượng"><button class="btn" onclick="${A('qAdd', o.id)}">${ic('plus', 16)} Thêm</button></div>
  <div class="row gap mt"><span class="mut sm">Sao chép từ bản:</span>${QN.map((n, i) => i == qi ? '' : `<button class="btn ghost sm" onclick="${A('qCopy', o.id, i)}">${n}</button>`).join('')}<span class="grow"></span><label class="mut sm" for="dc">Giảm giá (%)</label><input id="dc" type="number" min="0" max="100" class="w70" value="${o.disc || 0}" onchange="${'qDisc(\'' + o.id + '\',this.value)'}"></div>
  ${totalsBox(calc(o, it), o)}<div class="row end mt"><button class="btn" onclick="${A('qSend', o.id)}">${ic('check', 16)} Gửi báo giá cho khách</button></div></div>`;
}
function qAdd(id) {
  const o = O(id), [t, k] = $('#qi').value.split(':'), n = t == 's' ? 1 : Math.max(1, +$('#qn').value || 1), x = (t == 's' ? D.svc : D.parts).find(a => a.id == k), L = o.quotes[S.qv].items, e = L.find(i => i.id == k && i.t == t);
  if (e) { if (t == 'p') e.qty += n; else toast('Dịch vụ này đã có trong bản báo giá', 'err'); } else L.push({ t, id: k, name: x.name, qty: n, price: x.price });
  save(); R();
}
function qQty(id, k, d) { const i = O(id).quotes[S.qv].items[k]; i.qty = Math.max(1, i.qty + d); save(); R(); }
function qDel(id, k) { O(id).quotes[S.qv].items.splice(k, 1); save(); R(); }
function qCopy(id, from) { const o = O(id); if (!o.quotes[from].items.length) return toast('Bản nguồn chưa có hạng mục', 'err'); o.quotes[S.qv].items = JSON.parse(JSON.stringify(o.quotes[from].items)); save(); R(); toast('Đã sao chép hạng mục'); }
function qDisc(id, v) { O(id).disc = Math.min(100, Math.max(0, +v || 0)); save(); R(); }
function qSend(id) {
  const o = O(id); if (o.quotes.every(x => !x.items.length)) return toast('Cần có hạng mục trong ít nhất một phiên bản', 'err');
  o.status = 'quoted'; o.note = ''; o.issues = []; ev(o, 'Đã gửi báo giá cho khách'); notifyCus(o, `Gara đã gửi báo giá cho xe ${V(o.vid).plate}. Vui lòng xem và duyệt.`); logA('Gửi báo giá ' + o.no); save(); toast('Đã gửi báo giá, khách sẽ nhận thông báo'); R();
}
function assign(id) {
  const o = O(id); o.tech = $('#tc').value; o.status = 'working';
  o.tasks = o.quotes[o.chosen].items.filter(i => i.t == 's').map(i => ({ name: i.name, std: (D.svc.find(s => s.id == i.id) || {}).hrs || 0, sec: 0, run: null, done: false }));
  ev(o, 'Giao việc cho ' + UN(o.tech)); notify(o.tech, `Bạn được giao xe ${V(o.vid).plate} (${o.req})`); logA(`Giao việc ${o.no} cho ${UN(o.tech)}`); save(); toast('Đã giao việc'); R();
}
function pay(id) {
  const o = O(id), v = V(o.vid), low = []; o.status = 'paid'; o.pay = $('#pm').value; o.paidAt = iso(); v.km = Math.max(v.km, o.km); v.nextKm = o.km + 5000; v.nextDate = iso(180);
  o.quotes[o.chosen].items.filter(i => i.t == 'p').forEach(i => { const p = D.parts.find(x => x.id == i.id); if (p) { p.stock = Math.max(0, p.stock - i.qty); if (p.stock <= p.min) low.push(p.name + ' (còn ' + p.stock + ')'); } });
  if (low.length) notify('role:admin', 'Phụ tùng sắp hết sau khi xuất kho: ' + low.join(', ') + '. Cần nhập thêm.');
  ev(o, `Bàn giao xe và thanh toán ${fm(tot(o))} (${o.pay})`); notifyCus(o, `Cảm ơn quý khách! Xe ${v.plate} đã được bàn giao. Lịch bảo dưỡng tiếp theo: ${dmy(v.nextDate)}.`); logA(`Thanh toán ${o.no}: ${fm(tot(o))}`); save(); toast('Đã bàn giao xe và thanh toán'); R();
}

/* ----- Lịch hẹn ----- */
function rAppts() {
  const l = D.appts.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), sb = { new: ['Chờ xác nhận', 'warn'], confirmed: ['Đã xác nhận', 'blue'], done: ['Đã tiếp nhận', 'ok'], cancel: ['Đã hủy', 'err'] };
  return hd('Lịch hẹn', 'Khách đặt lịch trên ứng dụng sẽ hiện ở đây') + (l.length ? `<div class="grid g2">${l.map(a => { const v = V(a.vid), s = sb[a.status]; return `<div class="card"><div class="row sp">${plate(v)}<span class="badge ${s[1]}">${s[0]}</span></div><div class="mt"><b>${dmy(a.date)} lúc ${a.time}</b></div><div class="mut sm">${esc(v.owner)} - ${esc(v.phone)}</div><div class="sm" style="margin-top:6px">${esc(a.note)}</div>
  ${a.status == 'new' || a.status == 'confirmed' ? `<div class="row gap mt">${a.status == 'new' ? `<button class="btn sm" onclick="${A('apptSet', a.id, 'confirmed')}">Xác nhận</button>` : ''}${D.orders.some(o => o.vid == v.id && o.status != 'paid') ? '' : `<button class="btn ghost sm" onclick="apptRecv('${a.id}')">Tiếp nhận xe</button>`}<button class="btn ghost sm" onclick="${A('apptSet', a.id, 'cancel')}">Hủy lịch</button></div>` : ''}</div>`; }).join('')}</div>` : empty('Chưa có lịch hẹn nào', 'calendar'));
}
function apptSet(id, st) { const a = D.appts.find(x => x.id == id), v = V(a.vid), c = custOf(v); a.status = st; if (c) notify(c.id, st == 'confirmed' ? `Lịch hẹn ${dmy(a.date)} ${a.time} cho xe ${v.plate} đã được xác nhận.` : `Lịch hẹn ${dmy(a.date)} cho xe ${v.plate} đã bị hủy.`); save(); toast(st == 'confirmed' ? 'Đã xác nhận lịch hẹn' : 'Đã hủy lịch hẹn'); R(); }
function apptRecv(id) { const a = D.appts.find(x => x.id == id); oForm(a.vid, a.note, id); }
