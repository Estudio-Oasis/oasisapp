import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { BrutalistHero } from "@/components/home/BrutalistHero";
import { BriefSection } from "@/components/home/BriefSection";
import { ProofSection } from "@/components/home/ProofSection";
import { CapabilitiesSection } from "@/components/home/CapabilitiesSection";
import { ToolsMarqueeSection } from "@/components/home/ToolsMarqueeSection";
import { QuoteBuilder } from "@/components/home/QuoteBuilder";
import { CasesSection } from "@/components/home/CasesSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { GrowthInfrastructureSection, PaidMediaPrinciple, OasisLabsSection, HumanContactSection, CollectiveBridge } from "@/components/home/GrowthNarrative";
import { Seo } from "@/components/Seo";
import { useSmoothScroll, useScrollReveal } from "@/hooks/useSmoothScroll";

export default function LandingPage() {
  useSmoothScroll();
  useScrollReveal();

  return (
    <div className="min-h-screen font-body bg-[hsl(var(--paper))]">
      <div className="grain-overlay" aria-hidden />
      <Seo title={{ es: "Estudio Oasis — Sistemas de crecimiento", en: "Estudio Oasis — Growth systems" }} description={{ es: "Estrategia, creatividad, adquisición, tecnología, automatización y ventas conectadas en un sistema de crecimiento medible.", en: "Strategy, creative, acquisition, technology, automation, and sales connected in a measurable growth system." }} path="/" />
      <SiteNavbar />

      <BrutalistHero />
      <BriefSection />
      <ProofSection />
      <GrowthInfrastructureSection />
      <PaidMediaPrinciple />
      <CasesSection />
      <QuoteBuilder />
      <CapabilitiesSection />
      <ToolsMarqueeSection />
      <ProcessSection />
      <OasisLabsSection />
      <HumanContactSection />
      <CollectiveBridge />
      <ClosingCTA />

      <SiteFooter />
    </div>
  );
}
