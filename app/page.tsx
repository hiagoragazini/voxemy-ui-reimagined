
"use client";

import Header from "../src/components/landing/Header";
import Hero from "../src/components/landing/Hero";
import Benefits from "../src/components/landing/Benefits";
import HowItWorks from "../src/components/landing/HowItWorks";
import PricingPlans from "../src/components/landing/PricingPlans";
import Testimonials from "../src/components/landing/Testimonials";
import Footer from "../src/components/landing/Footer";

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
