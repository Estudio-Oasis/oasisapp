import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { BrutalistHero } from "@/components/home/BrutalistHero";
import { BriefSection } from "@/components/home/BriefSection";
import { ProofSection } from "@/components/home/ProofSection";
import { CapabilitiesSection } from "@/components/home/CapabilitiesSection";
import { ToolsMarqueeSection } from "@/components/home/ToolsMarqueeSection";
import { CasesSection } from "@/components/home/CasesSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { useSmoothScroll, useScrollReveal } from "@/hooks/useSmoothScroll";

export default function LandingPage() {
  useSmoothScroll();
  useScrollReveal();

  return (
    <div className="min-h-screen font-body bg-[#FCFCFA]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <BrutalistHero />
      <BriefSection />
      <ProofSection />
      <CasesSection />
      <CapabilitiesSection />
      <ToolsMarqueeSection />
      <ProcessSection />
      <ClosingCTA />

      <SiteFooter />
    </div>
  );
}
