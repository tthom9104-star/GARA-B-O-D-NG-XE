/* ===== KHÁCH HÀNG: trang chủ, xe của tôi, duyệt báo giá, đặt lịch, hóa đơn ===== */
const myVeh = () => D.veh.filter(v => v.phone == me.phone);
const myOrd = () => D.orders.filter(o => myVeh().some(v => v.id == o.vid));

function cHome() {
  const vs = myVeh(), ords = myOrd(), paid = ords.filter(o => o.status == 'paid'), act = ords.filter(o => o.status != 'paid'), td = iso();
  const due = vs.filter(v => v.nextDate && (v.nextDate <= iso(30) || v.km >= (v.nextKm || 1e9) - 500));
  const ap = D.appts.filter(a => vs.some(v => v.id == a.vid) && a.date >= td && (a.status == 'new' || a.status == 'confirmed')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let h = hd(`Xin chào, ${esc(me.name)}`, 'Theo dõi tình trạng xe và duyệt báo giá ngay trên điện thoại', `<button class="btn" onclick="go('book')">${ic('calendar', 16)} Đặt lịch bảo dưỡng</button>`);
  due.forEach(v => h += `<div class="alert">${ic('bell')}<div><b>${esc(v.plate)}</b> sắp đến hạn bảo dưỡng định kỳ (${dmy(v.nextDate)} hoặc ${(v.nextKm || 0).toLocaleString('vi-VN')} km).</div><button class="btn sm" onclick="go('book')">Đặt lịch</button></div>`);
  h += `<div class="grid g4">${kpi('car', 'Xe của tôi', vs.length, '', 'blue')}${kpi('history', 'Lần bảo dưỡng', paid.length, '', 'violet')}${kpi('dollar', 'Tổng chi phí', fm(paid.reduce((a, o) => a + tot(o), 0)), '', 'green')}${kpi('calendar', 'Lịch hẹn sắp tới', ap.length, ap[0] ? dmy(ap[0].date) + ' ' + ap[0].time : '', 'orange')}</div>`;
  h += `<h3 style="margin:22px 0 12px">Xe đang ở gara</h3>` + (act.length ? act.map(o => cOrder(o)).join('') : `<div class="card">${empty('Hiện không có xe nào đang sửa chữa', 'car')}</div>`);
  return h;
}
function cOrder(o) {
  const v = V(o.vid);
  let b = '';
  if (o.status == 'quoted') b = `<div class="alert blue" style="margin:16px 0 14px">${ic('alert')}<div><b>Gara gửi báo giá cho xe của bạn.</b> Hãy chọn một phiên bản để duyệt, gara sẽ bắt đầu sửa sau khi bạn đồng ý.</div></div>${qCompare(o)}`;
  else if (o.status == 'received') b = `<p class="mut sm mt">${o.note ? 'Bạn đã yêu cầu chỉnh sửa báo giá. Gara sẽ gửi lại sớm.' : 'Gara đang kiểm tra xe và soạn báo giá cho bạn.'}</p>`;
  else if (o.status == 'approved') b = `<p class="mut sm mt">Bạn đã duyệt bản <b>${o.quotes[o.chosen].name}</b> (${fm(tot(o))}). Gara đang sắp xếp thợ.</p>`;
  else if (o.status == 'working') b = `<div class="mt">${progress(o)}</div><p class="mut sm mt">Thợ ${esc(UN(o.tech))} đang sửa xe của bạn.</p>`;
  else if (o.status == 'done') b = `<div class="alert blue" style="margin-top:16px">${ic('check')}<div><b>Xe đã sửa xong.</b> Mời bạn đến nhận xe. Tổng thanh toán: <b>${fm(tot(o))}</b>.</div></div>`;
  return `<div class="card" style="margin-bottom:12px"><div class="row sp"><div>${plate(v)}<div class="mut sm" style="margin-top:6px">${esc(v.model)} - ${esc(o.req)}</div></div>${bdg(o.status)}</div>${stepper(o)}${b}</div>`;
}
function qCompare(o) {
  return `<div class="grid g3">${o.quotes.map((x, i) => {
    if (!x.items.length) return ''; const c = calc(o, x.items);
    return `<div class="card plan ${i == 1 ? 'rec' : ''}">${i == 1 ? '<span class="ribbon">Phổ biến</span>' : ''}<b>${x.name}</b><div class="price">${fm(c.t)}</div><div class="mut xs">Đã gồm VAT ${vatOf(o)}%${o.disc ? ', giảm ' + o.disc + '%' : ''}</div>
    <ul>${x.items.map(m => `<li>${ic('check', 14)}<span>${esc(m.name)}${m.qty > 1 ? ' ×' + m.qty : ''}</span></li>`).join('')}</ul><button class="btn ${i == 1 ? '' : 'ghost'}" onclick="${A('appr', o.id, i)}">Duyệt bản này</button></div>`;
  }).join('')}</div><div class="row end mt"><button class="btn ghost sm" onclick="${A('reqChange', o.id)}">Yêu cầu chỉnh sửa báo giá</button></div>`;
}
function appr(id, i) {
  const o = O(id); ask(`Duyệt báo giá bản <b>${o.quotes[i].name}</b> với tổng <b>${fm(calc(o, o.quotes[i].items).t)}</b>?`, () => {
    o.chosen = i; o.status = 'approved'; ev(o, 'Khách duyệt bản ' + o.quotes[i].name); notify('role:rec', `Khách ${V(o.vid).owner} đã duyệt báo giá bản ${o.quotes[i].name} (xe ${V(o.vid).plate}).`); toast('Đã duyệt báo giá');
  }, 'Duyệt báo giá');
}
function reqChange(id) {
  form('Yêu cầu chỉnh sửa báo giá', [{ k: 'n', l: 'Bạn muốn gara điều chỉnh điều gì?', t: 'textarea', req: 1, ph: 'Ví dụ: Bỏ hạng mục thay bugi, giữ phần thay dầu' }], r => {
    const o = O(id); o.note = r.n.trim(); o.status = 'received'; ev(o, 'Khách yêu cầu chỉnh sửa báo giá'); notify('role:rec', `Khách ${V(o.vid).owner} yêu cầu chỉnh sửa báo giá xe ${V(o.vid).plate}: ${r.n.trim()}`); toast('Đã gửi yêu cầu cho gara');
  }, 'Gửi yêu cầu');
}
function cVeh() {
  const vs = myVeh();
  return hd('Xe của tôi', 'Lịch sử bảo dưỡng và sửa chữa của từng xe') + (vs.map(v => `<div class="card" style="margin-bottom:14px"><div class="row sp"><div>${plate(v)}<div class="mut sm" style="margin-top:6px">${esc(v.model)}</div></div><div class="chips" style="margin:0"><span class="chip">${km(v.km)}</span>${v.nextDate ? `<span class="chip ${v.nextDate <= iso(30) ? 'warn' : ''}">Bảo dưỡng kế tiếp: ${dmy(v.nextDate)}</span>` : ''}</div></div><h3 style="margin:16px 0 10px">Lịch sử</h3>${hist(v.id)}</div>`).join('') || `<div class="card">${empty('Chưa có xe nào gắn với số điện thoại của bạn', 'car')}</div>`);
}
function cBook() {
  const vs = myVeh(), mine = D.appts.filter(a => vs.some(v => v.id == a.vid)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), sb = { new: ['Chờ xác nhận', 'warn'], confirmed: ['Đã xác nhận', 'blue'], done: ['Đã đến gara', 'ok'], cancel: ['Đã hủy', 'err'] };
  const slots = []; for (let h = 8; h <= 17; h++) { slots.push(p2(h) + ':00'); if (h < 17) slots.push(p2(h) + ':30'); }
  return hd('Đặt lịch bảo dưỡng', 'Chọn xe, ngày giờ và nội dung. Gara sẽ xác nhận lại với bạn') + `<div class="grid g2"><div class="card"><h3>Lịch hẹn mới</h3>
  <label class="fl">Xe</label><select id="bv">${vs.map(v => `<option value="${v.id}">${esc(v.plate)} - ${esc(v.model)}</option>`).join('')}</select>
  <label class="fl">Ngày</label><input id="bd" type="date" min="${iso()}" value="${iso(1)}"><label class="fl">Giờ</label><select id="bt">${slots.map(s => `<option>${s}</option>`).join('')}</select>
  <label class="fl">Nội dung</label><textarea id="bn" rows="3" placeholder="Ví dụ: Bảo dưỡng định kỳ, xe có tiếng kêu lạ..."></textarea><div class="row end mt"><button class="btn" onclick="bookGo()">Đặt lịch</button></div></div>
  <div class="card"><h3>Lịch hẹn của tôi</h3>${mine.map(a => { const s = sb[a.status], v = V(a.vid); return `<div class="li" style="cursor:default"><div><b>${dmy(a.date)} lúc ${a.time}</b><div class="mut xs">${esc(v.plate)} - ${esc(a.note)}</div></div><div class="row gap"><span class="badge ${s[1]}">${s[0]}</span>${a.status == 'new' || a.status == 'confirmed' ? `<button class="icon dng" title="Hủy lịch" onclick="${A('bookCancel', a.id)}">${ic('x', 16)}</button>` : ''}</div></div>`; }).join('') || empty('Bạn chưa có lịch hẹn nào', 'calendar')}</div></div>`;
}
function bookGo() {
  const v = V($('#bv').value), d = $('#bd').value, n = $('#bn').value.trim();
  if (!v) return toast('Bạn chưa có xe để đặt lịch', 'err'); if (!d || d < iso()) return toast('Vui lòng chọn ngày từ hôm nay trở đi', 'err'); if (!n) return toast('Vui lòng nhập nội dung bảo dưỡng', 'err');
  D.appts.push({ id: uid(), vid: v.id, date: d, time: $('#bt').value, note: n, status: 'new' }); notify('role:rec', `Lịch hẹn mới: ${me.name} (${v.plate}) ngày ${dmy(d)} lúc ${$('#bt').value}`); save(); toast('Đã gửi lịch hẹn cho gara'); R();
}
function bookCancel(id) { ask('Hủy lịch hẹn này?', () => { D.appts.find(a => a.id == id).status = 'cancel'; notify('role:rec', `Khách ${me.name} đã hủy một lịch hẹn.`); toast('Đã hủy lịch hẹn'); }, 'Hủy lịch', 1); }
function cInv() {
  const l = myOrd().filter(o => o.status == 'paid').sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return hd('Hóa đơn', 'Các lần thanh toán tại gara') + `<div class="card tw">${l.length ? `<table><tr><th>Số phiếu</th><th>Ngày</th><th>Xe</th><th>Nội dung</th><th class="r">Tổng</th><th></th></tr>${l.map(o => `<tr><td>${o.no}</td><td>${dmy(o.paidAt)}</td><td>${esc(V(o.vid).plate)}</td><td>${esc(o.req)}</td><td class="r">${fm(tot(o))}</td><td class="r"><button class="btn ghost sm" onclick="${A('printO', o.id, 'invoice')}">${ic('printer', 14)} Xem và in</button></td></tr>`).join('')}</table>` : empty('Chưa có hóa đơn nào', 'dollar')}</div>`;
}
