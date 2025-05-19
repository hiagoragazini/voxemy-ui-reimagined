
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingPlans from "@/components/landing/PricingPlans";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const navigate = useNavigate();
  
  // Login handler that redirects to dashboard
  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <Header onLoginClick={handleLogin} />
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
};

export default Index;
