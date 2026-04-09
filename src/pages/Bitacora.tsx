import { OasisBitacoraProvider, BitacoraCore } from "@/modules/bitacora";
import { useBitacoraVM } from "@/modules/bitacora/BitacoraContext";
import { BitacoraSidebar } from "@/components/bitacora/BitacoraSidebar";

function BitacoraInner() {
  const vm = useBitacoraVM();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-6xl mx-auto">
      {/* Main column */}
      <BitacoraCore autoOpenSheet={!vm.hasData} />

      {/* Contextual sidebar — desktop only */}
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <BitacoraSidebar />
        </div>
      </aside>
    </div>
  );
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
