/* Service worker: lưu các file giao diện để mở được khi mất mạng */
const C='gara-v2',F=['./','index.html','css/style.css','js/core.js','js/common.js','js/admin.js','js/reception.js','js/tech.js','js/customer.js','js/app.js','manifest.json','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))))});
self.addEventListener('fetch',e=>{if(e.request.method!='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();if(new URL(e.request.url).origin==location.origin)caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
