/* ===== DÙNG CHUNG: thành phần giao diện mà nhiều vai trò cùng dùng ===== */
const hd = (t, s, r) => `<div class="ph"><div><h1>${t}</h1>${s ? `<p class="mut">${s}</p>` : ''}</div><div class="row gap">${r || ''}</div></div>`;
const kpi = (i, l, v, sub, c) => `<div class="card stat"><div class="si ${c || ''}">${ic(i, 22)}</div><div><div class="mut sm">${l}</div><div class="sv">${v}</div>${sub ? `<div class="mut xs">${sub}</div>` : ''}</div></div>`;
const empty = (t, i) => `<div class="empty">${ic(i || 'box', 34)}<p>${t}</p></div>`;
const bdg = s => `<span class="badge ${ST[s][1]}">${ST[s][0]}</span>`;
const plate = v => `<span class="plate">${esc(v.plate)}</span>`;
const km = n => (+n || 0).toLocaleString('vi-VN') + ' km';

function stepper(o) {
  const k = STEPS.indexOf(o.status), L = ['Tiếp nhận', 'Báo giá', 'Đã duyệt', 'Đang sửa', 'Hoàn tất', 'Thanh toán'];
  return `<div class="steps">${L.map((l, i) => { const dn = i < k || o.status == 'paid'; return `<div class="step ${dn ? 'done' : i == k ? 'cur' : ''}"><i>${dn ? ic('check', 14) : i + 1}</i><span>${l}</span></div>`; }).join('')}</div>`;
}
function hist(vid) {
  const l = D.orders.filter(o => o.vid == vid && o.status == 'paid').sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  if (!l.length) return empty('Xe chưa có lịch sử bảo dưỡng', 'history');
  return `<div class="tl">${l.map(o => `<div class="tli"><div class="dot"></div><div class="card flat"><div class="row sp"><b>${dmy(o.paidAt)} · ${km(o.km)}</b><b>${fm(tot(o))}</b></div><div class="mut sm">${esc(o.req)}</div><div class="chips">${o.quotes[o.chosen].items.map(i => `<span class="chip ${i.t}">${esc(i.name)}${i.qty > 1 ? ' ×' + i.qty : ''}</span>`).join('')}</div></div></div>`).join('')}</div>`;
}
function vHist(id) {
  const v = V(id); modal(`<div class="mh"><h3>${esc(v.plate)} - ${esc(v.model)}</h3><button class="icon" onclick="this.closest('.ov').remove()" aria-label="Đóng">${ic('x')}</button></div><div class="mb">${hist(id)}</div><div class="mf"></div>`, 1);
}
/* Danh sách xe có tìm kiếm. ro=true: chỉ tra cứu (thợ) */
function vehList(ro) {
  const q = S.q.toLowerCase(), l = D.veh.filter(v => (v.plate + v.owner + v.phone + v.model).toLowerCase().includes(q));
  return `<div class="toolbar"><div class="search">${ic('search', 16)}<input id="qs" placeholder="Tìm biển số, tên chủ xe, số điện thoại..." value="${esc(S.q)}" oninput="S.q=this.value;R('qs')"></div>${ro ? '' : `<button class="btn" onclick="vForm()">${ic('plus', 16)} Tạo hồ sơ xe</button>`}</div>` +
    (l.length ? `<div class="grid g2">${l.map(v => {
      const n = D.orders.filter(o => o.vid == v.id && o.status == 'paid').length, act = D.orders.find(o => o.vid == v.id && o.status != 'paid');
      return `<div class="card"><div class="row sp"><div>${plate(v)}<div class="mut sm" style="margin-top:6px">${esc(v.model)}</div></div>${act ? bdg(act.status) : ''}</div>
      <div class="mut sm" style="margin-top:10px">${esc(v.owner)} - ${esc(v.phone)}</div>
      <div class="chips"><span class="chip">${km(v.km)}</span><span class="chip">${n} lần bảo dưỡng</span>${v.nextDate ? `<span class="chip ${v.nextDate <= iso(14) ? 'warn' : ''}">Kỳ tới: ${dmy(v.nextDate)}</span>` : ''}</div>
      <div class="row gap mt"><button class="btn ghost sm" onclick="${A('vHist', v.id)}">${ic('history', 14)} Lịch sử</button>${ro || act ? '' : `<button class="btn sm" onclick="${A('oForm', v.id)}">Tiếp nhận xe</button>`}</div></div>`;
    }).join('')}</div>` : empty('Không tìm thấy xe phù hợp', 'car'));
}
function totalsBox(c, o) {
  return `<div class="tot"><div><span>Tạm tính</span><span>${fm(c.s)}</span></div>${o.disc ? `<div><span>Giảm giá ${o.disc}%</span><span>-${fm(c.d)}</span></div>` : ''}<div><span>VAT ${vatOf(o)}%</span><span>${fm(c.v)}</span></div><div class="grand"><span>Tổng cộng</span><span>${fm(c.t)}</span></div></div>`;
}
function orderLog(o) {
  return `<div class="card"><h3>Nhật ký phiếu</h3><div class="log">${o.log.slice().reverse().map(l => `<div><b>${esc(l.txt)}</b> <span class="xs">${hm(l.t)}</span></div>`).join('') || '<div>Chưa có</div>'}</div></div>`;
}
/* Mẫu in báo giá / hóa đơn. qi: chỉ số phiên bản báo giá (khi chưa chọn) */
function docHTML(o, kind, qi) {
  const v = V(o.vid), s = D.settings, idx = o.chosen == null ? (qi == null ? 1 : qi) : o.chosen, items = o.quotes[idx].items, c = calc(o, items);
  const title = kind == 'quote' ? `BÁO GIÁ - Bản ${o.quotes[idx].name}` : 'HÓA ĐƠN DỊCH VỤ';
  return `<div class="pdoc"><div class="hh"><div><h2>${esc(s.name)}</h2><div>${esc(s.addr)}<br>ĐT: ${esc(s.phone)}</div></div><div style="text-align:right"><h2>${title}</h2><div>Số: ${o.no}</div><div>Ngày: ${dmy(o.paidAt || iso())}</div></div></div>
  <div class="pc"><div><b>Khách hàng:</b> ${esc(v.owner)}<br>SĐT: ${esc(v.phone)}</div><div><b>Xe:</b> ${esc(v.plate)} - ${esc(v.model)}<br>Số km: ${km(o.km)}</div></div>
  <table><tr><th>STT</th><th>Hạng mục</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>${items.map((i, k) => `<tr><td>${k + 1}</td><td>${esc(i.name)}</td><td>${i.qty}</td><td>${fm(i.price)}</td><td>${fm(i.qty * i.price)}</td></tr>`).join('')}</table>
  <div class="pt"><div><span>Tạm tính</span><span>${fm(c.s)}</span></div>${o.disc ? `<div><span>Giảm giá ${o.disc}%</span><span>-${fm(c.d)}</span></div>` : ''}<div><span>VAT ${vatOf(o)}%</span><span>${fm(c.v)}</span></div><div><b>Tổng cộng</b><b>${fm(c.t)}</b></div></div>
  <div class="sig"><div><b>Khách hàng</b><br>(Ký, ghi rõ họ tên)</div><div><b>Nhân viên gara</b><br>(Ký, ghi rõ họ tên)</div></div></div>`;
}
const printO = (id, kind, qi) => printDoc(docHTML(O(id), kind, qi));
