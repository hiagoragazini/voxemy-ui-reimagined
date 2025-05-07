
"use client";

import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingPlans from "@/components/landing/PricingPlans";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <HowItWorks />
        <PricingPlans />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
