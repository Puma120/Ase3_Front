import { PropsWithChildren } from "react";

// En la PWA el navegador ya reserva las barras del sistema (el viewport no pasa
// por debajo), asi que los margenes seguros son cero. El paquete real depende
// de modulos nativos de react-native, que no se pueden empaquetar para web.
const NONE = { top: 0, right: 0, bottom: 0, left: 0 };

export function SafeAreaProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function useSafeAreaInsets() {
  return NONE;
}
