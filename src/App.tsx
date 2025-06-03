
import React, { useState, useContext, createContext } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentConfig from "./pages/AgentConfig";
import Campaigns from "./pages/Campaigns";
import CampaignForm from "./pages/CampaignForm";
import CampaignDetails from "./pages/CampaignDetails";
import Leads from "./pages/Leads";
import LeadImport from "./pages/LeadImport";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

// Test pages
import TwilioTest from "./pages/TwilioTest";
import TwilioManualTest from "./pages/TwilioManualTest";
import AudioTester from "./pages/AudioTester";
import ConversationRelayTest from "./pages/ConversationRelayTest";
import CallsMonitoring from "./pages/CallsMonitoring";
import Roadmap from "./pages/Roadmap";

interface AuthContextProps {
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
  const navigate = useNavigate();

  const login = (user: any) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Routes>
          {/* Rota pública - Landing page */}
          <Route path="/" element={<Index />} />
          
          {/* Rotas de autenticação */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/agents" element={
            <ProtectedRoute>
              <Agents />
            </ProtectedRoute>
          } />
          
          <Route path="/agents/new" element={
            <ProtectedRoute>
              <AgentConfig />
            </ProtectedRoute>
          } />
          
          <Route path="/agents/:id/edit" element={
            <ProtectedRoute>
              <AgentConfig />
            </ProtectedRoute>
          } />

          <Route path="/campaigns" element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/new" element={
            <ProtectedRoute>
              <CampaignForm />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id" element={
            <ProtectedRoute>
              <CampaignDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id/edit" element={
            <ProtectedRoute>
              <CampaignForm />
            </ProtectedRoute>
          } />

          <Route path="/leads" element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          } />
          
          <Route path="/leads/import" element={
            <ProtectedRoute>
              <LeadImport />
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          {/* Nova rota para Roadmap */}
          <Route path="/roadmap" element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          } />

          {/* Páginas de teste */}
          <Route path="/twilio-test" element={
            <ProtectedRoute>
              <TwilioTest />
            </ProtectedRoute>
          } />
          
          <Route path="/twilio-manual-test" element={
            <ProtectedRoute>
              <TwilioManualTest />
            </ProtectedRoute>
          } />
          
          <Route path="/audio-tester" element={
            <ProtectedRoute>
              <AudioTester />
            </ProtectedRoute>
          } />
          
          <Route path="/conversation-relay-test" element={
            <ProtectedRoute>
              <ConversationRelayTest />
            </ProtectedRoute>
          } />

          <Route path="/calls-monitoring" element={
            <ProtectedRoute>
              <CallsMonitoring />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
