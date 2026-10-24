// Web (PWA): sin push por ahora; los avisos se leen en la tarjeta "Avisos"
// del Inicio. La version nativa vive en push.native.ts (Metro la prefiere).
export interface PushPrefs {
  enabled: boolean;
  sound: boolean;
  bubble: boolean;
}

export function isPushSupported(): boolean {
  return false;
}
export function getPushPrefs(): PushPrefs {
  return { enabled: false, sound: false, bubble: false };
}
export async function resumePush(): Promise<void> {}
export async function enablePush(_sound: boolean): Promise<boolean> {
  return false;
}
export async function disablePush(): Promise<void> {}
export async function setPushSound(_sound: boolean): Promise<void> {}
export function isBubbleSupported(): boolean {
  return false;
}
export async function setPushBubble(_bubble: boolean): Promise<void> {}
export async function openBubbleSettings(): Promise<void> {}
export async function teardownPush(): Promise<void> {}
