
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
import TwilioTestPage from './pages/TwilioTest';
import TwilioManualTestPage from './pages/TwilioManualTest';
import ConversationRelayTestPage from './pages/ConversationRelayTest';

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
      element: <ProtectedRoute><Dashboard /></ProtectedRoute>
    },
    {
      path: "/dashboard",
      element: <ProtectedRoute><Dashboard /></ProtectedRoute>
    },
    // Add new route for ConversationRelay test
    {
      path: "/conversation-relay-test",
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
      path: "/twiliotest",
      element: <ProtectedRoute><TwilioTestPage /></ProtectedRoute>
    },
    {
      path: "/twiliomanualtest",
      element: <ProtectedRoute><TwilioManualTestPage /></ProtectedRoute>
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
