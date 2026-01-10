/**
 * API Client với Axios
 */

import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants';

// Tạo Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: thêm JWT token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor: xử lý lỗi
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        const isRegisterRequest = error.config?.url?.includes('/auth/register');

        // Hiển thị toast cho các lỗi server (trừ login/register - đã có UI riêng)
        if (!isLoginRequest && !isRegisterRequest && error.response) {
            const message = error.response.data?.message || 'Đã xảy ra lỗi';
            toast.error(message);
        }

        // Redirect về login nếu 401 (trừ auth requests)
        if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// Helper functions
export function setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
}

export function removeAccessToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
}

export { api };
