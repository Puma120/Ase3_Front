// Stub para el build web: services/localStore.ts usa localStorage en web y solo
// toca expo-secure-store en nativo, pero el bundler igual necesita resolver el import.
export function getItem(): string | null {
  return null;
}
export function setItem(): void {}
export async function deleteItemAsync(): Promise<void> {}
