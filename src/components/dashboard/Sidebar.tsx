
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Phone,
  MessageSquare,
  BarChart2,
  Settings
} from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Agentes', path: '/agents', icon: Users },
    { name: 'Campanhas', path: '/campaigns', icon: Phone },
    { name: 'Leads', path: '/leads', icon: MessageSquare },
    { name: 'Relatórios', path: '/reports', icon: BarChart2 },
    { name: 'Configurações', path: '/settings', icon: Settings },
  ];

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Voxemy</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
            `}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      {/* Status footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="rounded-md bg-blue-50 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Utilização do sistema</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div className="bg-blue-600 h-1.5 rounded-full w-7/12"></div>
          </div>
          <p className="text-xs text-gray-600">580 mins / 1000 mins</p>
        </div>
      </div>
    </div>
  );
}
