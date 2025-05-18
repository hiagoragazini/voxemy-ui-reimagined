
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Phone, 
  BarChart3, 
  Settings, 
  PhoneCall,
  MessageSquare
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("/dashboard");
  
  const menuItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Agentes", 
      href: "/agents", 
      icon: Users 
    },
    { 
      name: "Campanhas", 
      href: "/campaigns", 
      icon: Phone 
    },
    { 
      name: "Leads", 
      href: "/leads", 
      icon: MessageSquare 
    },
    { 
      name: "Configurações", 
      href: "/settings", 
      icon: Settings 
    },
    {
      name: "Zenvia Test",
      href: "/zenvia-test",
      icon: PhoneCall
    },
    {
      name: "Twilio Test",
      href: "/twilio-test",
      icon: PhoneCall
    },
    {
      name: "Voicebot Test",
      href: "/voicebot-test",
      icon: PhoneCall
    }
  ];

  const handleNavigation = (href: string) => {
    setActiveItem(href);
    navigate(href);
  };

  return (
    <div className="bg-white dark:bg-gray-800 h-full w-64 fixed left-0 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-start h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl font-semibold text-gray-800 dark:text-white">Voxemy</span>
      </div>
      
      <nav className="px-4 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`flex items-center p-2 rounded-lg ${
                  activeItem === item.href
                    ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                onClick={() => setActiveItem(item.href)}
              >
                <item.icon className="w-5 h-5 mr-2" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
