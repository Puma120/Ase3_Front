// Service worker minimo: solo cumple el requisito de instalabilidad del PWA.
// No cachea nada para no servir versiones viejas de la app tras un deploy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
