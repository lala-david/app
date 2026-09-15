// 사운즈펀 브릿지 서비스워커: 알림 클릭 처리
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || '/';
  const scope = self.registration.scope.replace(/\/$/, '');
  const target = scope + path;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => c.url.startsWith(scope));
      if (client) {
        client.postMessage({ type: 'notification-open', url: path });
        return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

// 서버 Web Push 연결 시 사용
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: self.registration.scope + 'icons/pwa-192.png',
      data: { url: payload.url },
    }),
  );
});
