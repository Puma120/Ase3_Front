// Estado de sesion minimo compartido entre pantallas: un solo booleano
// reactivo (logueado o no) via un pub/sub casero. No se agrega una libreria
// de estado global (Zustand/Redux) para esto - no hace falta para 4
// pantallas y un solo flag.

type Listener = () => void;

let loggedIn = false;
const listeners = new Set<Listener>();

export function isLoggedIn(): boolean {
  return loggedIn;
}

export function setLoggedIn(value: boolean): void {
  loggedIn = value;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
