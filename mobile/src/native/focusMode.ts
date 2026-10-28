// Web (PWA): el navegador no puede cambiar No molestar. La version nativa vive
// en focusMode.native.ts (Metro la prefiere).
export function isFocusModeSupported(): boolean {
  return false;
}

export function ensureFocusAccess(): void {}

export async function setFocusMode(_enabled: boolean): Promise<string> {
  return "Esa acción solo está disponible en la app de Android.";
}
