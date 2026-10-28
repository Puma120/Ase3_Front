/// <reference types="vite/client" />
import { useEffect, useState } from "react";

// APK de EAS (build "preview"). Las URLs de artefactos de EAS caducan con el
// build: al generar uno nuevo se actualiza VITE_APK_URL en Vercel y se redeploya.
const APK_URL =
  import.meta.env.VITE_APK_URL ??
  "https://expo.dev/artifacts/eas/BsIqFsUVuC1YnlDk4gRBtWqK0jm9GmPA7acOMo9RZDc.apk";

const DISMISS_KEY = "oportuno.installbar.dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const ua = navigator.userAgent;
const IS_IOS = /iPad|iPhone|iPod/.test(ua);

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const FONT = '"Atkinson Hyperlegible Next", system-ui, sans-serif';

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid #ffb36b",
  background: "transparent",
  color: "#fbf5ee",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: FONT,
  textDecoration: "none",
  cursor: "pointer",
};

export default function InstallBar() {
  const [hidden, setHidden] = useState(() => isStandalone() || dismissedRecently());
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sin almacenamiento: se oculta solo en esta visita */
    }
    setHidden(true);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  return (
    <section
      aria-label="Descargar Oportuno"
      style={{
        background: "#2a2233",
        color: "#fbf5ee",
        padding: "10px 16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        fontFamily: FONT,
        fontSize: 14,
      }}
    >
      <span style={{ flex: "1 1 180px" }}>
        {iosHelp
          ? "En Safari toca Compartir y luego Agregar a pantalla de inicio."
          : "Lleva Oportuno contigo en tu celular."}
      </span>
      {prompt && (
        <button type="button" style={btn} onClick={install}>
          <Icon d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          Instalar app web
        </button>
      )}
      {IS_IOS && !iosHelp && (
        <button type="button" style={btn} onClick={() => setIosHelp(true)}>
          <Icon d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          Instalar app web
        </button>
      )}
      {!IS_IOS && (
        <a style={btn} href={APK_URL} rel="noopener">
          <Icon d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          Descargar APK (Android)
        </a>
      )}
      <button type="button" style={{ ...btn, border: "none", padding: "0 12px" }}
        onClick={close} aria-label="Cerrar aviso de descarga">
        <Icon d="M6 6l12 12M18 6L6 18" />
      </button>
    </section>
  );
}
