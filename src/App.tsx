
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AgentList from "./pages/AgentList";
import AgentNew from "./pages/AgentNew";
import AgentDetails from "./pages/AgentDetails";
import CampaignList from "./pages/CampaignList";
import CampaignNew from "./pages/CampaignNew";
import CampaignDetails from "./pages/CampaignDetails";
import LeadList from "./pages/LeadList";
import LeadImport from "./pages/LeadImport";
import CallsMonitoring from "./pages/CallsMonitoring"; // New import

function App() {
  return (
    <BrowserRouter>
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
      <Toaster position="top-right" closeButton richColors expand={false} />
    </BrowserRouter>
  );
}

export default App;
