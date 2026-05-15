/**
 * useHasMounted — hidratação client-only sem setState em useEffect.
 *
 * Usa `useSyncExternalStore` para retornar `false` no SSR/primeiro render do
 * cliente e `true` após hidratação. Evita o anti-pattern de
 * `useState(false) + useEffect(() => setState(true), [])` (lint:
 * react-hooks/set-state-in-effect).
 *
 * Uso típico: guard antes de ler stores persistidos no localStorage
 * (Zustand persist) para prevenir hydration mismatch.
 */

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}
