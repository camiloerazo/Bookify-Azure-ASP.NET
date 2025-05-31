import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import { BrowserRouter } from 'react-router-dom'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Login from './Login.tsx'
import Dashboard from './Dashboard.tsx'
import AdminDashboard from './AdminDashboard.tsx'
import AuthProvider from './AuthProvider.tsx'
import ProtectedRoute from './ProtectedRoute.tsx'
import Register from './Register.tsx'
import Rooms from './Rooms.tsx'

const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    {
        path: "/dashboard",
        element: <ProtectedRoute />,
        children: [
            { path: "", element: <Dashboard /> }
        ]
    },
    {
        path: "/admin",
        element: <AdminDashboard />
    },
    {
        path: "/rooms",
        element: <ProtectedRoute />,
        children: [
            { path: "", element: <Rooms /> }
        ]
    },
    { path: "/register", element: <Register /> }
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
  </StrictMode>,
)
