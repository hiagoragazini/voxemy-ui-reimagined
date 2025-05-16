
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
import LeadList from "./pages/Leads";
import LeadImport from "./pages/LeadImport";
import CallsMonitoring from "./pages/CallsMonitoring";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster />
    </>
  );
}

export default App;
