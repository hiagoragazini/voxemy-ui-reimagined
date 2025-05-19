import './App.css'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import NewAgent from './pages/NewAgent';
import EditAgent from './pages/EditAgent';
import Campaigns from './pages/Campaigns';
import NewCampaign from './pages/NewCampaign';
import CampaignDetails from './pages/CampaignDetails';
import EditCampaign from './pages/EditCampaign';
import TwilioTestPage from './pages/TwilioTest';
import TwilioManualTestPage from './pages/TwilioManualTest';
import ConversationRelayTestPage from './pages/ConversationRelayTest';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App

function AppRoutes() {
  const { user } = useContext(AuthContext);

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!user) {
      return <Navigate to="/signin" />;
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
      path: "/agents/new",
      element: <ProtectedRoute><NewAgent /></ProtectedRoute>
    },
    {
      path: "/agents/:id/edit",
      element: <ProtectedRoute><EditAgent /></ProtectedRoute>
    },
    {
      path: "/campaigns",
      element: <ProtectedRoute><Campaigns /></ProtectedRoute>
    },
    {
      path: "/campaigns/new",
      element: <ProtectedRoute><NewCampaign /></ProtectedRoute>
    },
    {
      path: "/campaigns/:id",
      element: <ProtectedRoute><CampaignDetails /></ProtectedRoute>
    },
    {
      path: "/campaigns/:id/edit",
      element: <ProtectedRoute><EditCampaign /></ProtectedRoute>
    },
    {
      path: "/twiliotest",
      element: <ProtectedRoute><TwilioTestPage /></ProtectedRoute>
    },
    {
      path: "/twiliomanualtest",
      element: <ProtectedRoute><TwilioManualTestPage /></ProtectedRoute>
    },
    {
      path: "/signin",
      element: <SignIn />
    },
    {
      path: "/signup",
      element: <SignUp />
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
