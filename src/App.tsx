
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Dashboard from "./pages/Dashboard";
import AgentList from "./pages/Agents";
import AgentNew from "./pages/AgentConfig";
import AgentDetails from "./pages/Agents"; // This should later be updated with a dedicated details page
import CampaignList from "./pages/Campaigns";
import CampaignNew from "./pages/CampaignForm";
import CampaignDetails from "./pages/CampaignDetails";
import LeadList from "./pages/Leads";
import LeadImport from "./pages/LeadImport";
import CallsMonitoring from "./pages/CallsMonitoring";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import AudioTester from "./pages/AudioTester";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Dashboard and core pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/audio-tester" element={<AudioTester />} />
        
        {/* Agents */}
        <Route path="/agents" element={<AgentList />} />
        <Route path="/agents/new" element={<AgentNew />} />
        <Route path="/agents/:id" element={<AgentDetails />} />
        <Route path="/agents/:id/edit" element={<AgentNew />} />
        
        {/* Campaigns */}
        <Route path="/campaigns" element={<CampaignList />} />
        <Route path="/campaigns/new" element={<CampaignNew />} />
        <Route path="/campaigns/:id" element={<CampaignDetails />} />
        <Route path="/campaigns/:id/edit" element={<CampaignNew />} />
        
        {/* Leads */}
        <Route path="/leads" element={<LeadList />} />
        <Route path="/leads/import" element={<LeadImport />} />
        
        {/* Calls Monitoring */}
        <Route path="/calls" element={<CallsMonitoring />} />
        
        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <Toaster />
    </>
  );
}

export default App;
