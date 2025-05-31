import { useAuth } from './AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
    const { isLoggedIn, user } = useAuth();
    
    // For now, we'll consider any logged-in user as an admin
    // In a real application, you would check for a specific admin role
    const isAdmin = isLoggedIn && user !== null;
    
    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
} 