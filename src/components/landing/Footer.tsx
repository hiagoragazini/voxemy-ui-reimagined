
import { Link } from "react-router-dom";
import Logo from "@/components/shared/Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: "Produto",
      links: [
        { name: "Features", href: "#" },
        { name: "Preços", href: "#" },
        { name: "Casos de uso", href: "#" },
        { name: "Roadmap", href: "#" },
      ]
    },
    {
      title: "Empresa",
      links: [
        { name: "Sobre nós", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Carreiras", href: "#" },
        { name: "Contato", href: "#" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Política de privacidade", href: "#" },
        { name: "Termos de uso", href: "#" },
        { name: "Política de cookies", href: "#" },
      ]
    },
    {
      title: "Suporte",
      links: [
        { name: "FAQ", href: "#" },
        { name: "Documentação", href: "#" },
        { name: "Suporte", href: "#" },
        { name: "Status", href: "#" },
      ]
    }
  ];
  
  const socialLinks = [
    { name: "Instagram", href: "#" },
    { name: "Twitter", href: "#" },
    { name: "LinkedIn", href: "#" },
  ];

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-12">
          <div className="md:col-span-2">
            <Logo className="mb-6" />
            <p className="text-slate-400 mb-6 max-w-md">
              Transforme seu atendimento com agentes de voz alimentados por inteligência artificial avançada.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
          
          {footerLinks.map((category, index) => (
            <div key={index} className="md:col-span-1">
              <h3 className="font-medium text-white mb-4">{category.title}</h3>
              <ul className="space-y-3">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {currentYear} Voxemy AI. Todos os direitos reservados.</p>
          
          <div className="flex mt-4 md:mt-0">
            <Link to="/login" className="hover:text-white transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
