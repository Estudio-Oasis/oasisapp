import { OasisBitacoraProvider, BitacoraCore } from "@/modules/bitacora";

/**
 * OasisOS shell — thin wrapper that provides the real Supabase-backed context.
 */
export default function BitacoraPage() {
  return (
    <OasisBitacoraProvider>
      <BitacoraCore />
    </OasisBitacoraProvider>
  );
}
