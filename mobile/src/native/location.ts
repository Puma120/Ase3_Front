// Web (PWA): sin ubicacion en segundo plano; la version nativa vive en
// location.native.ts (Metro la prefiere).
export function isLocationSupported(): boolean {
  return false;
}
export function isLocationEnabled(): boolean {
  return false;
}
export async function resumeLocation(): Promise<void> {}
export async function enableLocation(): Promise<boolean> {
  return false;
}
export async function disableLocation(): Promise<void> {}
export async function stopLocationTracking(): Promise<void> {}
