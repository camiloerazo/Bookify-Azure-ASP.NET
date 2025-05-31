import React, { Dispatch, SetStateAction } from 'react'

export interface User {
    Id: number;
    Email: string;
    Name: string;
    Password: string;
    Reservations: {
        $id?: string;
        $values?: any[];
    } | any[];
    Payments: {
        $id?: string;
        $values?: any[];
    } | any[];
}

export interface AuthContextType {
    user: User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
    isLoggedIn: boolean;
    setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
    login: (userData: User) => void;
    logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};