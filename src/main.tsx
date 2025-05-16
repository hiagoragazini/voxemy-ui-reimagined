
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';

import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import AudioTester from './pages/AudioTester';
import Auth from './pages/Auth';
import Index from './pages/Index';

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
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
