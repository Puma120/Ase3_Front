// Web (PWA): la web siempre carga la ultima version al recargar. La version
// nativa vive en appUpdate.native.ts (Metro la prefiere).
export function isAppUpdateSupported(): boolean {
  return false;
}

export async function updateApp(): Promise<string> {
  return "";
}
