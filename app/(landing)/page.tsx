"use server"

import { FeaturesSection } from "@/components/landing/features"
import { HeroSection } from "@/components/landing/hero"
import { CTASection } from "@/components/landing/cta"
import { FooterSection } from "@/components/landing/footer"
export default async function HomePage() {
  return (
    <div className="flex flex-col gap-12 pb-20">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
