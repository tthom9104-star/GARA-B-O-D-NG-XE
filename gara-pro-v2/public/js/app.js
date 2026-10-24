/* ===== KHUNG ỨNG DỤNG: đăng nhập, menu theo vai trò, thông báo, giao diện sáng/tối =====
   File này nạp sau các file vai trò; chỉ api.js được nạp sau nó */
const NAV = {
  admin: [['dash', 'grid', 'Tổng quan'], ['users', 'users', 'Nhân viên & tài khoản'], ['catalog', 'box', 'Danh mục & kho'], ['report', 'chart', 'Báo cáo'], ['logs', 'history', 'Nhật ký'], ['settings', 'sliders', 'Cài đặt']],
  rec: [['dash', 'grid', 'Tổng quan'], ['vehicles', 'car', 'Xe & khách'], ['orders', 'clipboard', 'Phiếu tiếp nhận'], ['appts', 'calendar', 'Lịch hẹn']],
  tech: [['dash', 'wrench', 'Việc của tôi'], ['lookup', 'car', 'Tra cứu xe']],
  cus: [['dash', 'grid', 'Trang chủ'], ['cvehicles', 'car', 'Xe của tôi'], ['book', 'calendar', 'Đặt lịch'], ['invoices', 'dollar', 'Hóa đơn']]
};
const VIEWS = {
  admin: { dash: aDash, users: aUsers, catalog: aCatalog, report: aReport, logs: aLogs, settings: aSettings },
  rec: { dash: rDash, vehicles: rVehicles, orders: rOrders, appts: rAppts },
  tech: { dash: tDash, lookup: tLookup },
  cus: { dash: cHome, cvehicles: cVeh, book: cBook, invoices: cInv }
};
const mineN = () => D.notifs.filter(n => n.to == me.id || n.to == 'role:' + me.role);

function loginHTML() {
  const demo = [['admin', 'admin', 'Quản lý (Admin)'], ['letan', '123', 'Lễ tân'], ['tho', '123', 'Thợ kỹ thuật'], ['khach', '123', 'Khách hàng']];
  return `<div class="login"><section class="hero"><div class="brand"><div class="logo">${ic('wrench', 20)}</div>Gara Pro</div>
  <div><h2>Mỗi chiếc xe một hồ sơ rõ ràng.</h2><p>Quản lý tiếp nhận, báo giá, sửa chữa và thanh toán trên một hệ thống. Dùng được trên máy tính lẫn điện thoại.</p>
  <ul><li>${ic('check')}Báo giá 3 phiên bản để khách chọn trước khi sửa</li><li>${ic('check')}Thợ bấm giờ công và báo lỗi phát sinh ngay tại xe</li><li>${ic('check')}Khách theo dõi tiến độ và nhận nhắc bảo dưỡng định kỳ</li></ul></div><div class="mut xs" style="color:#6b7686">Gara Pro v2</div></section>
  <section class="lf"><div class="box"><h1>Đăng nhập</h1><p class="mut" style="margin:4px 0 8px">Dùng tài khoản do gara cấp</p>
  <label class="fl">Tên đăng nhập</label><input id="lu" autocomplete="username"><label class="fl">Mật khẩu</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key=='Enter')doLogin()">
  <button class="btn" style="width:100%;justify-content:center;margin-top:16px" onclick="doLogin()">Đăng nhập</button>
  <p class="mut sm" style="margin:18px 0 0">Tài khoản dùng thử, bấm để điền sẵn:</p><div class="demo">${demo.map(d => `<button class="btn ghost sm" onclick="fill('${d[0]}','${d[1]}')">${d[2]}</button>`).join('')}</div></div></section></div>`;
}
const fill = (u, p) => { $('#lu').value = u; $('#lp').value = p; $('#lp').focus(); };
function doLogin() {
  const u = D.users.find(x => x.user == $('#lu').value.trim() && x.pw == $('#lp').value);
  if (!u) return toast('Sai tên đăng nhập hoặc mật khẩu', 'err');
  me = u; try { localStorage.setItem('gara_me', u.id); } catch (e) { } S.view = ''; S.sel = null; S.q = ''; S.pop = null; S.rf = 'all'; logA('Đăng nhập'); save(); R();
}
function logout() { logA('Đăng xuất'); save(); me = null; try { localStorage.removeItem('gara_me'); } catch (e) { } S.pop = null; R(); }
function pop(k) { S.pop = S.pop == k ? null : k; if (k == 'bell' && S.pop) { mineN().forEach(n => { if (!n.seen.includes(me.id)) n.seen.push(me.id); }); save(); } R(); }
function profile() { S.pop = null; form('Thông tin tài khoản', [{ k: 'name', l: 'Họ tên', v: me.name, req: 1 }, { k: 'pw', l: 'Mật khẩu mới (bỏ trống nếu không đổi)', t: 'password' }], r => { me.name = r.name.trim(); if (r.pw) me.pw = r.pw; toast('Đã cập nhật tài khoản'); }); }
function toggleTheme() { theme(document.documentElement.dataset.theme == 'dark' ? 'light' : 'dark'); S.pop = null; R(); }

function R(f) {
  const app = $('#app');
  if (!me) { app.innerHTML = loginHTML(); return; }
  const nav = NAV[me.role]; if (!nav.some(n => n[0] == S.view)) S.view = nav[0][0];
  let body; try { body = VIEWS[me.role][S.view](); } catch (e) { console.error(e); body = `<div class="card"><h3>Không hiển thị được màn hình này</h3><p class="mut">${esc(e.message)}</p></div>`; }
  const un = mineN().filter(n => !n.seen.includes(me.id)).length, dark = document.documentElement.dataset.theme == 'dark', cur = nav.find(n => n[0] == S.view);
  const pops = S.pop == 'bell' ? `<div class="bd" onclick="pop('bell')"></div><div class="pop"><div class="pi"><b>Thông báo</b></div>${mineN().slice(0, 12).map(n => `<div class="pi">${esc(n.txt)}<small>${hm(n.t)}</small></div>`).join('') || '<div class="pi mut">Chưa có thông báo</div>'}</div>`
    : S.pop == 'menu' ? `<div class="bd" onclick="pop('menu')"></div><div class="pop" style="width:240px"><div class="pi"><b>${esc(me.name)}</b><small>${ROLE[me.role]}</small></div><button class="pm" onclick="roleGuide()">${ic('users', 16)} Vai trò & quyền hạn</button><button class="pm" onclick="profile()">${ic('edit', 16)} Thông tin tài khoản</button><button class="pm" onclick="toggleTheme()">${ic(dark ? 'sun' : 'moon', 16)} Giao diện ${dark ? 'sáng' : 'tối'}</button><button class="pm" onclick="logout()">${ic('logout', 16)} Đăng xuất</button></div>` : '';
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><div class="logo">${ic('wrench', 20)}</div>Gara Pro</div><nav class="nav">${nav.map(n => `<a class="${S.view == n[0] ? 'on' : ''}" onclick="go('${n[0]}')" role="button" tabindex="0">${ic(n[1], 19)}<span>${n[2]}</span></a>`).join('')}</nav>
  <div class="me"><div class="avatar">${esc(me.name.trim().split(' ').pop()[0] || '?')}</div><div><div>${esc(me.name)}</div><div style="color:#8f9aab">${ROLE[me.role]}</div></div></div></aside>
  <div class="main"><header class="top"><span class="t">${cur ? cur[2] : ''}</span><span class="d">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span><span class="grow"></span>
  <button class="icon" onclick="toggleTheme()" aria-label="Đổi giao diện sáng tối">${ic(dark ? 'sun' : 'moon')}</button><button class="icon" onclick="pop('bell')" aria-label="Thông báo">${ic('bell')}${un ? `<span class="dot-n">${un}</span>` : ''}</button><button class="icon" onclick="pop('menu')" aria-label="Tài khoản"><span class="avatar" style="width:30px;height:30px;font-size:13px">${esc(me.name.trim().split(' ').pop()[0] || '?')}</span></button>${pops}</header>
  <main class="content">${body}</main></div></div>`;
  if (f) { const e = document.getElementById(f); if (e) { e.focus(); const l = e.value.length; e.setSelectionRange(l, l); } }
}
/* Đồng hồ bấm giờ của thợ: cập nhật mỗi giây, không cần vẽ lại cả trang */
setInterval(() => $$('.tmr').forEach(e => { const r = +e.dataset.run; if (r) e.textContent = fmT((+e.dataset.base) + Math.floor((Date.now() - r) / 1000)); }), 1000);
/* Đồng bộ giữa các tab trình duyệt */
addEventListener('storage', e => { if (e.key == KEY && e.newValue) { try { D = JSON.parse(e.newValue); me = me && D.users.find(u => u.id == me.id) || null; R(); } catch (x) { } } });
/* PWA: cài đặt như ứng dụng, chạy offline (cần chạy qua http/https, ví dụ Live Server) */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
R();
