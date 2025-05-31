import React, { useState } from 'react'
import { AuthContext, User } from './AuthContext'

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const login = (userData: User) => {
        // Handle reference-preserving JSON format
        const processedUserData = {
            ...userData,
            payments: userData.payments?.$values || userData.payments || [],
            reservations: userData.reservations?.$values || userData.reservations || []
        };
        setUser(processedUserData);
        setIsLoggedIn(true);
        // Store processed data in localStorage
        localStorage.setItem('user', JSON.stringify(processedUserData));
    };

    const logout = () => {
        setUser(null);
        setIsLoggedIn(false);
        // Clear localStorage
        localStorage.removeItem('user');
    };

    // Check for stored user data on mount
    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser) as User;
                login(userData);
            } catch (error) {
                console.error('Failed to parse stored user data:', error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const value = {
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}