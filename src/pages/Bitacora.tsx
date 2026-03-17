import { OasisBitacoraProvider, BitacoraCore } from "@/modules/bitacora";
import { useBitacoraVM } from "@/modules/bitacora/BitacoraContext";

function BitacoraInner() {
  const vm = useBitacoraVM();
  return <BitacoraCore autoOpenSheet={!vm.hasData} />;
}

/**
 * OasisOS shell — thin wrapper that provides the real Supabase-backed context.
 */
export default function BitacoraPage() {
  return (
    <OasisBitacoraProvider>
      <BitacoraInner />
    </OasisBitacoraProvider>
  );
}
