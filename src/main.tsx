
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AudioTester from './pages/AudioTester';
import Auth from './pages/Auth';
import Index from './pages/Index';
import TwilioManualTest from './pages/TwilioManualTest';

// Create a client
const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "settings",
    element: <Settings />,
  },
  {
    path: "audio-tester",
    element: <AudioTester />
  },
  {
    path: "twilio-manual-test",
    element: <TwilioManualTest />
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
