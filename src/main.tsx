
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Note: We're using a simpler router setup that just renders the App component
// which handles all routing internally
const router = createBrowserRouter([
  {
    path: "/*", // This wildcard path ensures all routes are handled by App.tsx
    element: <App />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
