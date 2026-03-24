import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

interface AdminUser {
    id: number;
    email: string;
    nome: string;
}

interface AuthContextType {
    admin: AdminUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('serpos_admin_token');
        const savedUser = localStorage.getItem('serpos_admin_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setAdmin(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, senha: string) => {
        const { data } = await api.post('/auth/login', { email, senha });
        localStorage.setItem('serpos_admin_token', data.token);
        localStorage.setItem('serpos_admin_user', JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
    };

    const logout = () => {
        localStorage.removeItem('serpos_admin_token');
        localStorage.removeItem('serpos_admin_user');
        setToken(null);
        setAdmin(null);
    };

    return (
        <AuthContext.Provider
            value={{
                admin,
                token,
                isAuthenticated: !!admin,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return context;
}
