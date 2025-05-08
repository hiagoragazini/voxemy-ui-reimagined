
"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Os agentes de IA da Voxemy AI transformaram completamente nosso atendimento ao cliente. Economizamos cerca de 30 horas por semana com automatização.",
      author: "Mariana Silva",
      role: "CEO, TechSolutions",
      avatar: "MS"
    },
    {
      quote: "A implementação foi incrivelmente rápida e o suporte é fenomenal. Nossos clientes nem percebem que estão falando com uma IA.",
      author: "Carlos Mendes",
      role: "Diretor de Operações, VendaMais",
      avatar: "CM"
    },
    {
      quote: "Aumentamos nossa taxa de conversão em 40% após implementar os agentes de voz da Voxemy AI no nosso processo de vendas.",
      author: "Ana Luiza Costa",
      role: "CMO, GrowthDigital",
      avatar: "AC"
    }
  ];

  const companies = [
    "TechSolutions", "VendaMais", "GrowthDigital", "InnovateBR", "StartupXP"
  ];
  
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">O que nossos clientes dizem</h2>
          
          <div className="relative bg-slate-800/30 rounded-xl p-8 md:p-10 border border-slate-700/50">
            <svg 
              className="absolute text-violet-500/20 w-20 h-20 top-6 left-6" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.192 15.757c0-.88-.23-2.618-2.434-2.618h-.517c.906-1.426 2.676-2.893 4.177-3.253.386-.092.77.194.77.58 0 .813.669 1.483 1.483 1.483.846 0 1.483-.67 1.483-1.483 0-1.215-1.177-2.387-2.765-2.387-1.925 0-4.126 1.093-5.45 2.704C6.15 12.387 5 14.592 5 17.242c0 1.215.906 2.387 2.434 2.387 1.351 0 3.758-1.006 3.758-3.872zm9.808 0c0-.88-.23-2.618-2.434-2.618h-.517c.905-1.426 2.676-2.893 4.177-3.253.385-.092.77.194.77.58 0 .813.669 1.483 1.483 1.483.846 0 1.483-.67 1.483-1.483 0-1.215-1.178-2.387-2.766-2.387-1.925 0-4.126 1.093-5.45 2.704-1.79 1.603-2.942 3.808-2.942 6.458 0 1.215.906 2.387 2.434 2.387 1.352 0 3.758-1.006 3.758-3.872z" />
            </svg>
            
            <div className="relative z-10 transition-all duration-300">
              <blockquote className="text-xl mb-6 relative">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>
              
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarFallback className="bg-violet-600">
                    {testimonials[activeTestimonial].avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{testimonials[activeTestimonial].author}</div>
                  <div className="text-slate-400 text-sm">{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 transition-all ${
                    index === activeTestimonial ? "bg-violet-500 w-6" : "bg-slate-600 hover:bg-slate-500"
                  }`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-16">
            <p className="text-slate-400 text-center text-sm mb-6">Empresas que já usam Voxemy AI</p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 opacity-70">
              {companies.map((company, index) => (
                <div key={index} className="text-lg font-semibold text-slate-400">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
