
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
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

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Routes>
          {/* Rota pública - Landing page */}
          <Route path="/" element={<Index />} />
          
          {/* Rotas de autenticação */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />

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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
