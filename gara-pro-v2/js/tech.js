/* ===== THỢ KỸ THUẬT: việc được giao, bấm giờ công, cập nhật hạng mục, báo lỗi phát sinh ===== */
function tDash() {
  if (S.sel && O(S.sel)) return tDetail(O(S.sel));
  const mine = D.orders.filter(o => o.tech == me.id), work = mine.filter(o => o.status == 'working'), mo = iso().slice(0, 7);
  const dn = mine.filter(o => (o.status == 'done' || o.status == 'paid') && (o.paidAt || o.date || '').startsWith(mo));
  const hrs = mine.filter(o => (o.paidAt || o.date || '').startsWith(mo)).reduce((a, o) => a + o.tasks.reduce((b, t) => b + hh(t), 0), 0);
  return hd('Việc của tôi', `Xin chào ${esc(me.name)}, chọn một xe để bắt đầu làm việc`) +
    `<div class="grid g3">${kpi('wrench', 'Đang làm', work.length, '', 'violet')}${kpi('check', 'Hoàn thành tháng này', dn.length, '', 'green')}${kpi('clock', 'Giờ công tháng này', hrs.toFixed(1) + 'h', '', 'blue')}</div>
  <h3 style="margin:20px 0 12px">Xe được phân công</h3>` + (work.length ? `<div class="grid g2">${work.map(o => { const v = V(o.vid); return `<div class="card" style="cursor:pointer" onclick="${A('tOpen', o.id)}"><div class="row sp">${plate(v)}<span class="mut xs">${o.no}</span></div><div class="mut sm" style="margin:8px 0">${esc(v.model)} - ${esc(o.req)}</div>${progress(o)}</div>`; }).join('')}</div>` : empty('Hiện chưa có xe nào được giao cho bạn', 'wrench'));
}
const tOpen = id => { S.sel = id; R(); scrollTo(0, 0); };
function tLookup() { return hd('Tra cứu xe', 'Xem thông tin xe và lịch sử sửa chữa trước khi làm') + vehList(1); }
function tDetail(o) {
  const v = V(o.vid), ro = o.status != 'working';
  return `<div style="margin-bottom:12px"><button class="btn ghost sm" onclick="S.sel=null;R()">← Việc của tôi</button></div>
  <div class="card"><div class="row sp"><div>${plate(v)}<div class="mut sm" style="margin-top:6px">${esc(v.model)} - ${km(o.km)}</div></div>${bdg(o.status)}</div><div class="info"><div><span>Yêu cầu của khách</span>${esc(o.req)}</div><div><span>Phiên bản đã duyệt</span>${o.chosen != null ? o.quotes[o.chosen].name : '-'}</div></div>${progress(o)}</div>
  <div class="card mt"><div class="row sp"><h3>Hạng mục công việc</h3>${ro ? '' : `<button class="btn ghost sm" onclick="${A('tAdd', o.id)}">${ic('plus', 14)} Thêm hạng mục</button>`}</div>
  ${o.tasks.map((t, i) => { const over = t.std && hh(t) > t.std * 1.2; return `<div class="task ${t.done ? 'dn' : ''}"><input type="checkbox" ${t.done ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="${'tDone(\'' + o.id + '\',' + i + ',this.checked)'}" aria-label="Hoàn thành"><div class="grow"><div class="tn"><b>${esc(t.name)}</b></div><div class="xs mut">Định mức ${t.std || 0}h - thực tế <span class="${over ? '' : ''}" style="${over ? 'color:var(--err);font-weight:600' : ''}">${hh(t).toFixed(2)}h</span></div></div>
  <span class="tmr" data-base="${t.sec || 0}" data-run="${t.run || ''}">${fmT(sec(t))}</span>${ro || t.done ? '' : `<button class="btn ${t.run ? 'dark' : ''} sm" onclick="${A('tToggle', o.id, i)}">${ic(t.run ? 'pause' : 'play', 14)} ${t.run ? 'Tạm dừng' : 'Bắt đầu'}</button>`}${ro ? '' : `<button class="icon" title="Nhập giờ thủ công" onclick="${A('tHours', o.id, i)}">${ic('edit', 16)}</button>`}</div>`; }).join('') || empty('Chưa có hạng mục', 'clipboard')}</div>
  <div class="card mt"><h3>Lỗi phát sinh</h3>${o.issues.map(s => `<div class="alert"><div>${esc(s)}</div></div>`).join('') || '<p class="mut sm">Chưa phát hiện lỗi mới.</p>'}${ro ? '' : `<div class="row gap mt"><button class="btn ghost" onclick="${A('tIssue', o.id)}">${ic('alert', 16)} Báo lỗi phát sinh</button></div>`}</div>
  ${ro ? '' : `<div class="row end mt"><button class="btn ok" onclick="${A('tFinish', o.id)}">${ic('check', 16)} Hoàn tất công việc</button></div>`}
  <div class="card mt"><h3>Lịch sử sửa chữa của xe</h3>${hist(o.vid)}</div>`;
}
function tDone(id, i, c) { const t = O(id).tasks[i]; if (c && t.run) { t.sec = sec(t); t.run = null; } t.done = c; save(); R(); }
function tToggle(id, i) {
  const o = O(id), t = o.tasks[i];
  if (t.run) { t.sec = sec(t); t.run = null; } else { o.tasks.forEach(x => { if (x.run) { x.sec = sec(x); x.run = null; } }); t.run = Date.now(); }
  save(); R();
}
function tHours(id, i) { const t = O(id).tasks[i]; form('Giờ công thực tế: ' + esc(t.name), [{ k: 'h', l: 'Số giờ thực tế', t: 'number', step: '0.05', min: 0, v: hh(t).toFixed(2), req: 1 }], r => { t.sec = Math.round((+r.h || 0) * 3600); t.run = null; }); }
function tAdd(id) { form('Thêm hạng mục phát sinh', [{ k: 'n', l: 'Tên hạng mục', req: 1 }, { k: 's', l: 'Định mức dự kiến (giờ)', t: 'number', step: '0.1', min: 0, v: 0.5 }], r => { O(id).tasks.push({ name: r.n.trim(), std: +r.s || 0, sec: 0, run: null, done: false }); ev(O(id), 'Thợ thêm hạng mục: ' + r.n.trim()); }); }
function tIssue(id) {
  form('Báo lỗi phát sinh', [{ k: 't', l: 'Mô tả lỗi mới phát hiện', t: 'textarea', req: 1, ph: 'Ví dụ: Rô-tuyn trái bị rơ, cần thay' }, { k: 'lv', l: 'Mức độ', o: [['Cần xử lý ngay', 'Cần xử lý ngay'], ['Nên xử lý sớm', 'Nên xử lý sớm'], ['Theo dõi thêm', 'Theo dõi thêm']] }], r => {
    const o = O(id); o.issues.push(`${r.t.trim()} (${r.lv})`); ev(o, 'Thợ báo lỗi phát sinh'); notify('role:rec', `Thợ ${me.name} báo lỗi phát sinh ở xe ${V(o.vid).plate}: ${r.t.trim()}`); toast('Đã báo cho lễ tân');
  }, 'Gửi báo cáo');
}
function tFinish(id) {
  const o = O(id); if (o.tasks.some(t => !t.done)) return toast('Còn hạng mục chưa hoàn thành', 'err');
  ask('Xác nhận hoàn tất toàn bộ công việc cho xe này?', () => {
    o.tasks.forEach(t => { if (t.run) { t.sec = sec(t); t.run = null; } }); o.status = 'done'; ev(o, me.name + ' hoàn tất công việc'); notify('role:rec', `Xe ${V(o.vid).plate} đã sửa xong, chờ bàn giao và thanh toán.`); notifyCus(o, `Xe ${V(o.vid).plate} của quý khách đã sửa xong, mời đến nhận xe.`); logA('Hoàn tất ' + o.no); S.sel = null; toast('Đã báo hoàn tất');
  }, 'Hoàn tất');
}
