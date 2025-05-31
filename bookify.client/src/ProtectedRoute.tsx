import { useAuth } from './AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    const { isLoggedIn } = useAuth();
    return isLoggedIn ? <Outlet /> : <Navigate to="/" replace/>;
}