import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// true si el sistema pide "reducir movimiento" (Android/iOS, o
// prefers-reduced-motion en la PWA via react-native-web). Las animaciones
// de la app (p. ej. el scroll del chat) se desactivan cuando esta activo.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && setReduced(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);
  return reduced;
}
