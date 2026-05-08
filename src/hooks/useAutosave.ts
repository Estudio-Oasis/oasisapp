import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Options<T> {
  value: T;
  onSave: (value: T) => Promise<{ error?: { message?: string } | null } | void>;
  delay?: number;
  enabled?: boolean;
  validate?: (value: T) => string | null;
  /** Compare equality. Default JSON.stringify. */
  equals?: (a: T, b: T) => boolean;
}

/**
 * Debounced autosave with per-field status. Skips first run after mount
 * and skips when value equals last persisted value.
 */
export function useAutosave<T>({
  value,
  onSave,
  delay = 700,
  enabled = true,
  validate,
  equals,
}: Options<T>) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const lastSavedRef = useRef<T>(value);
  const initializedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eq = equals ?? ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b));

  useEffect(() => {
    if (!enabled) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSavedRef.current = value;
      return;
    }
    if (eq(value, lastSavedRef.current)) return;

    if (validate) {
      const v = validate(value);
      if (v) {
        setStatus("error");
        setError(v);
        return;
      }
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      setError(null);
      const res = (await onSave(value)) as any;
      if (res?.error) {
        setStatus("error");
        setError(res.error.message ?? "Error al guardar");
      } else {
        lastSavedRef.current = value;
        setStatus("saved");
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled]);

  /** Reset baseline when external value loaded */
  const reset = (v: T) => {
    lastSavedRef.current = v;
    initializedRef.current = true;
    setStatus("idle");
    setError(null);
  };

  return { status, error, reset };
}
