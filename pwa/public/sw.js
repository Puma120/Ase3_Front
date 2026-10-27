// Service worker minimo: cumple el requisito de instalabilidad del PWA y
// muestra los avisos push de FCM (mobile/src/native/push.ts registra el token).
// No cachea nada para no servir versiones viejas de la app tras un deploy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

// iOS exige mostrar una notificacion por cada push recibido.
self.addEventListener("push", (e) => {
  let payload = {};
  try {
    payload = e.data ? e.data.json() : {};
  } catch {
    // payload no JSON: se muestra el aviso generico
  }
  const content = payload.notification || payload.data || {};
  e.waitUntil(
    self.registration.showNotification(content.title || "Oportuno", {
      body: content.body || "",
      icon: "/icons/icon-192.png",
      data: payload.data || {},
    }),
  );
});

// Al tocar el aviso: enfoca la app si ya esta abierta, si no la abre.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => "focus" in w);
      return open ? open.focus() : self.clients.openWindow("/");
    }),
  );
});
