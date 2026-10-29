// Login con Google, compartido entre pwa (iOS) y mobile/Expo (Android) via
// react-native-web: el backend hace todo el intercambio OAuth (ver
// auth_service/app/api/routes/google_auth.py), este archivo solo abre la URL
// correcta segun la plataforma y extrae el token de la redireccion de vuelta.
import { Linking, Platform } from "react-native";

import { GATEWAY_URL } from "./apiClient";

const MOBILE_REDIRECT_URI = "ase3agentetdah://auth/callback";

function extractToken(url: string): string | null {
  const match = url.match(/[?#]token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Dispara el login con Google. En web navega fuera de la pagina (el gateway
 * redirige de vuelta con #token=... al terminar); en nativo abre el navegador
 * del sistema y devuelve el token ya extraido, o null si el usuario cancelo. */
export async function startGoogleLogin(): Promise<string | null> {
  if (Platform.OS === "web") {
    window.location.href = `${GATEWAY_URL}/auth/google/login?platform=web`;
    return null; // la pagina navega fuera; el token se recoge en consumeWebCallbackToken tras volver
  }

  const WebBrowser = await import("expo-web-browser");
  const result = await WebBrowser.openAuthSessionAsync(
    `${GATEWAY_URL}/auth/google/login?platform=mobile`,
    MOBILE_REDIRECT_URI,
  );
  if (result.type !== "success") return null;
  return extractToken(result.url);
}

/** Solo nativo: recoge el token del enlace ase3agentetdah://auth/callback?token=...
 * aunque openAuthSessionAsync no haya devuelto `success` (Android puede reiniciar
 * o dormir la app mientras el usuario esta en el navegador y la promesa se pierde,
 * lo que obligaba a iniciar sesion dos veces). Devuelve la funcion para dejar de escuchar. */
export function listenForLoginLink(onToken: (token: string) => void): () => void {
  if (Platform.OS === "web") return () => {};
  const handle = (url: string | null) => {
    if (!url || !url.startsWith(MOBILE_REDIRECT_URI)) return;
    const token = extractToken(url);
    if (token) onToken(token);
  };
  Linking.getInitialURL().then(handle).catch(() => {});
  const sub = Linking.addEventListener("url", (e) => handle(e.url));
  return () => sub.remove();
}

/** Solo aplica en web: al volver de Google, App.tsx llama esto una vez al
 * montar para leer el token del hash de la URL (si lo hay) y limpiarlo. */
export function consumeWebCallbackToken(): string | null {
  if (Platform.OS !== "web") return null;
  const token = extractToken(window.location.hash);
  if (token) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return token;
}
