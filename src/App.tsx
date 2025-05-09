import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentConfig from "./pages/AgentConfig";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Business from "./pages/Business";
import NotFound from "./pages/NotFound";
import Campaigns from "./pages/Campaigns";
import CampaignForm from "./pages/CampaignForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Agent routes */}
      <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
      <Route path="/agents/new" element={<ProtectedRoute><AgentConfig /></ProtectedRoute>} />
      <Route path="/agents/:id/edit" element={<ProtectedRoute><AgentConfig /></ProtectedRoute>} />
      
      {/* Portuguese routes redirects */}
      <Route path="/agentes" element={<Navigate to="/agents" replace />} />
      <Route path="/agentes/novo" element={<Navigate to="/agents/new" replace />} />
      <Route path="/agentes/:id/editar" element={<Navigate to={({ params }) => `/agents/${params.id}/edit`} replace />} />
      
      {/* Other routes */}
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/business" element={<ProtectedRoute><Business /></ProtectedRoute>} />
      
      {/* Campaign routes */}
      <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
      <Route path="/campaigns/new" element={<ProtectedRoute><CampaignForm /></ProtectedRoute>} />
      <Route path="/campaigns/:id/edit" element={<ProtectedRoute><CampaignForm /></ProtectedRoute>} />
      
      {/* Portuguese campaign routes redirects */}
      <Route path="/campanhas" element={<Navigate to="/campaigns" replace />} />
      <Route path="/campanhas/nova" element={<Navigate to="/campaigns/new" replace />} />
      <Route path="/campanhas/:id/editar" element={<Navigate to={({ params }) => `/campaigns/${params.id}/edit`} replace />} />
      
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
