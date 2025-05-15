
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Dashboard from "./pages/Dashboard";
import AgentList from "./pages/Agents";
import AgentNew from "./pages/AgentConfig";
import AgentDetails from "./pages/Agents"; // Temporarily pointing to Agents page
import CampaignList from "./pages/Campaigns";
import CampaignNew from "./pages/CampaignForm";
import CampaignDetails from "./pages/CampaignDetails";
import LeadList from "./pages/Leads"; // Atualizando para a nova página de Leads
import LeadImport from "./pages/LeadImport"; // Criar nova página para importação de leads
import CallsMonitoring from "./pages/CallsMonitoring";
import Home from "./pages/Index"; // Update to correct home page

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Agents */}
        <Route path="/agents" element={<AgentList />} />
        <Route path="/agents/new" element={<AgentNew />} />
        <Route path="/agents/:id" element={<AgentDetails />} />
        
        {/* Campaigns */}
        <Route path="/campaigns" element={<CampaignList />} />
        <Route path="/campaigns/new" element={<CampaignNew />} />
        <Route path="/campaigns/:id" element={<CampaignDetails />} />
        
        {/* Leads */}
        <Route path="/leads" element={<LeadList />} />
        <Route path="/leads/import" element={<LeadImport />} />
        
        {/* Calls Monitoring */}
        <Route path="/calls" element={<CallsMonitoring />} />
        
        {/* Redirect to dashboard for any other route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      
      <Toaster />
    </>
  );
}

export default App;
