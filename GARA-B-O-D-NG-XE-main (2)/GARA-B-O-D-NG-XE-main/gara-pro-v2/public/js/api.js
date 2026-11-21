/* ===== API: dùng máy chủ khi có (node server.js), nếu không thì giữ chế độ localStorage như cũ =====
   Nạp SAU app.js. Tự phát hiện: /api/rev trả 401 nghĩa là đang chạy cùng máy chủ Gara Pro.
   Cách hoạt động: giao diện vẫn sửa thẳng vào biến D rồi gọi save(); ở chế độ máy chủ, save() so D với
   bản chụp lần đồng bộ trước, gửi phần thay đổi lên /api/sync, rồi tải lại dữ liệu mới nhất. */
const API = { on: false, tok: null, snap: {}, rev: 0, busy: false, again: false };
const SYNC = ['settings', 'users', 'svc', 'parts', 'veh', 'orders', 'appts', 'notifs', 'logs'], DELETABLE = ['users', 'svc', 'parts'];
const colDocs = c => c == 'settings' ? [D.settings] : D[c];

async function call(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(API.tok ? { Authorization: 'Bearer ' + API.tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status == 401 && API.tok) dropSession();
  if (!r.ok) throw new Error(j.error || 'Lỗi ' + r.status);
  return j;
}
function dropSession() { API.tok = null; try { localStorage.removeItem('gara_tok'); } catch (e) { } me = null; S.pop = null; R(); }
function snapshot() { API.snap = {}; SYNC.forEach(c => { API.snap[c] = {}; colDocs(c).forEach(d => API.snap[c][d.id] = JSON.stringify(d)); }); }
async function load() {
  const j = await call('GET', '/api/state');
  D = j.data; D.seq = 1; D.settings = D.settings || {};
  me = D.users.find(u => u.id == j.me) || null; API.rev = j.rev; snapshot();
}
async function push() {
  if (API.busy) { API.again = true; return; }
  API.busy = true;
  try {
    do {
      API.again = false; const ch = [];
      SYNC.forEach(c => {
        const cur = colDocs(c), old = API.snap[c] || {};
        cur.forEach(d => { if (!d.id) d.id = uid(); if (old[d.id] !== JSON.stringify(d)) ch.push({ col: c, id: d.id, doc: d }); });
        // chỉ gửi lệnh xóa cho dữ liệu admin được phép xóa (thông báo/nhật ký bị cắt bớt ở máy khách thì bỏ qua)
        if (DELETABLE.includes(c)) Object.keys(old).forEach(id => { if (!cur.some(d => d.id == id)) ch.push({ col: c, id, doc: null }); });
      });
      if (ch.length) { await call('POST', '/api/sync', { changes: ch }); await load(); R(); }
    } while (API.again);
  } catch (e) { toast(e.message, 'err'); try { await load(); } catch (x) { } R(); }
  API.busy = false;
}
async function srvLogin() {
  try {
    const j = await call('POST', '/api/login', { user: $('#lu').value.trim(), pw: $('#lp').value });
    API.tok = j.token; try { localStorage.setItem('gara_tok', j.token); } catch (e) { }
    await load(); S.view = ''; S.sel = null; S.q = ''; S.pop = null; S.rf = 'all'; logA('Đăng nhập'); save(); R();
  } catch (e) { toast(e.message == 'Failed to fetch' ? 'Không kết nối được máy chủ' : e.message, 'err'); }
}

const _save = save, _login = doLogin, _logout = logout, _reset = resetData;
save = () => API.on ? push() : _save();
doLogin = () => API.on ? srvLogin() : _login();
logout = async () => { if (!API.on) return _logout(); try { logA('Đăng xuất'); await push(); await call('POST', '/api/logout'); } catch (e) { } dropSession(); };
resetData = () => API.on
  ? ask('Toàn bộ dữ liệu trên máy chủ sẽ bị thay bằng dữ liệu mẫu và mọi người phải đăng nhập lại. Tiếp tục?', () => { call('POST', '/api/reset').then(() => { dropSession(); toast('Đã khôi phục dữ liệu mẫu'); }).catch(e => toast(e.message, 'err')); }, 'Khôi phục', 1)
  : _reset();

/* Nhiều máy cùng dùng: cứ 5 giây hỏi máy chủ có thay đổi mới không (bỏ qua khi đang mở popup hoặc đang gõ) */
setInterval(async () => {
  if (!API.on || !API.tok || API.busy || !me || document.hidden || $('.ov') || (document.activeElement && document.activeElement.matches('input,textarea,select'))) return;
  try { const j = await call('GET', '/api/rev'); if (j.rev != API.rev) { await load(); R(); } } catch (e) { }
}, 5000);

(async () => {
  try { const r = await fetch('/api/rev'); if (r.status != 401) return; } catch (e) { return; }
  API.on = true; me = null; try { API.tok = localStorage.getItem('gara_tok'); } catch (e) { }
  D = { settings: {}, users: [], svc: [], parts: [], veh: [], orders: [], appts: [], notifs: [], logs: [], seq: 1 };
  if (API.tok) { try { await load(); } catch (e) { API.tok = null; } }
  R();
})();
