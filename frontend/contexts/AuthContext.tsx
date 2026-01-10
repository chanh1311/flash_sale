'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { api, setAccessToken, removeAccessToken } from '@/lib/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user khi mount (nếu có token)
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get<User>(API_ENDPOINTS.PROFILE);
                setUser(response.data);
            } catch {
                // Token không hợp lệ -> xóa
                removeAccessToken();
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const response = await api.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials);
        const { accessToken, user: userData } = response.data;

        setAccessToken(accessToken);
        setUser(userData);
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const response = await api.post<AuthResponse>(API_ENDPOINTS.REGISTER, data);
        const { accessToken, user: userData } = response.data;

        setAccessToken(accessToken);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        removeAccessToken();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
