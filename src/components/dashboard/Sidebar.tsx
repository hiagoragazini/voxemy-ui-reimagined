
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
    <div className="h-full glass-morphism border-r border-apple-border flex flex-col">
      {/* Logo */}
      <div className="h-16 border-b border-apple-border flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary-apple flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-apple-text-primary">Voxemy</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-6 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              nav-item ${isActive ? 'active' : ''}
            `}
          >
            <item.icon className="h-5 w-5 mr-3 opacity-80" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      {/* Status footer */}
      <div className="p-6 border-t border-apple-border">
        <div className="rounded-xl bg-secondary/50 p-4 text-center">
          <p className="text-xs text-apple-text-secondary mb-2">Utilização do sistema</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div className="bg-primary-apple h-1.5 rounded-full w-7/12"></div>
          </div>
          <p className="text-sm text-apple-text-primary font-medium">580 mins <span className="text-apple-text-secondary font-normal">/ 1000 mins</span></p>
        </div>
      </div>
    </div>
  );
}
