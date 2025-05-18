
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from './pages/Dashboard.tsx';
import Agents from './pages/Agents.tsx';
import Campaigns from './pages/Campaigns.tsx';
import Leads from './pages/Leads.tsx';
import Settings from './pages/Settings.tsx';
import ZenviaTest from './pages/ZenviaTest.tsx';
import TwilioTest from './pages/TwilioTest.tsx';
import VoicebotTest from './pages/VoicebotTest.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/agents",
    element: <Agents />,
  },
  {
    path: "/campaigns",
    element: <Campaigns />,
  },
  {
    path: "/leads",
    element: <Leads />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/zenvia-test",
    element: <ZenviaTest />,
  },
  {
    path: "/twilio-test",
    element: <TwilioTest />,
  },
  {
    path: "/voicebot-test",
    element: <VoicebotTest />
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
