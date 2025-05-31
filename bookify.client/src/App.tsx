import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './AuthProvider';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import Rooms from './Rooms';
import './App.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;