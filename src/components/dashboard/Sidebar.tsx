
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Phone, 
  BarChart3, 
  Settings, 
  Menu,
  ChevronLeft, 
  PhoneCall
} from "lucide-react";
import { Logo } from "../shared/Logo";

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Links do menu
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Agentes", path: "/agents", icon: Users },
    { name: "Campanhas", path: "/campaigns", icon: Phone },
    { name: "Leads", path: "/leads", icon: Users },
    { name: "Chamadas", path: "/calls", icon: PhoneCall },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Configurações", path: "/settings", icon: Settings },
  ];
  
  // Links para ferramentas de teste
  const testTools = [
    { name: "Teste de Áudio", path: "/audio-tester", icon: Phone },
    { name: "Teste Twilio", path: "/twilio-manual-test", icon: PhoneCall },
    { name: "Teste Zenvia", path: "/zenvia-test", icon: PhoneCall },
  ];
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-800 shadow transition-width duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && <Logo />}
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {collapsed ? (
              <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto py-5">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon
                    className={`${collapsed ? "mx-auto" : "mr-3"} h-5 w-5`}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
          
          {/* Seção Ferramentas de Teste */}
          <div className="mt-8">
            {!collapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Ferramentas de Teste
              </h3>
            )}
            <ul className="space-y-2 px-3">
              {testTools.map((tool) => (
                <li key={tool.path}>
                  <Link
                    to={tool.path}
                    className={`flex items-center p-2 rounded-lg transition-colors ${
                      location.pathname === tool.path
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    <tool.icon
                      className={`${collapsed ? "mx-auto" : "mr-3"} h-5 w-5`}
                    />
                    {!collapsed && <span>{tool.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {!collapsed ? (
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                U
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuário
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  usuario@exemplo.com
                </p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              U
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
