import { LandingHeader } from "@/components/landing/landing-header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhyVisual } from "@/components/landing/why-visual";
import { StructureShowcase } from "@/components/landing/structure-showcase";
import { Personas } from "@/components/landing/personas";
import { Discovery } from "@/components/landing/discovery";
import { FeaturedProblems } from "@/components/landing/featured-problems";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="kn-landing min-h-screen bg-kn-bg text-kn-ink-0">
      <LandingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <WhyVisual />
        <StructureShowcase />
        <Personas />
        <Discovery />
        <FeaturedProblems />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
