import { BitacoraStandalone } from "@/modules/bitacora";

/**
 * /bitacora-demo — standalone shell using LocalTimerProvider + BitacoraCore.
 * No auth required. Data persists in localStorage.
 */
export default function BitacoraDemo() {
  return <BitacoraStandalone />;
}
