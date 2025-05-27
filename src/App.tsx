
import './App.css'
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext } from 'react';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import Settings from './pages/Settings';
import ConversationRelayTestPage from './pages/ConversationRelayTest';
import Leads from './pages/Leads';
import Reports from './pages/Reports';
import Index from './pages/Index';

function App() {
  return <AppRoutes />;
}

export default App

function AppRoutes() {
  // Temporary authentication check until proper auth context is implemented
  const isAuthenticated = true; // For now, always consider user as authenticated

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!isAuthenticated) {
      return <Navigate to="/" />;
    }

    return children;
  };

  const routes = [
    {
      path: "/",
      element: <Index />
    },
    {
      path: "/dashboard",
      element: <ProtectedRoute><Dashboard /></ProtectedRoute>
    },
    {
      path: "/vapi-test",
      element: <ProtectedRoute><ConversationRelayTestPage /></ProtectedRoute>
    },
    {
      path: "/agents",
      element: <ProtectedRoute><Agents /></ProtectedRoute>
    },
    {
      path: "/campaigns",
      element: <ProtectedRoute><Campaigns /></ProtectedRoute>
    },
    {
      path: "/campaigns/:id",
      element: <ProtectedRoute><CampaignDetails /></ProtectedRoute>
    },
    {
      path: "/leads",
      element: <ProtectedRoute><Leads /></ProtectedRoute>
    },
    {
      path: "/reports",
      element: <ProtectedRoute><Reports /></ProtectedRoute>
    },
    {
      path: "/settings",
      element: <ProtectedRoute><Settings /></ProtectedRoute>
    }
  ];

  return (
    <Routes>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}
