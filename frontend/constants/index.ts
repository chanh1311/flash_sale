/**
 * Constants cho Flash Sale Frontend
 */

// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// WebSocket URL
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',

    // Products
    PRODUCTS: '/products',
    PRODUCT_DETAIL: (id: number) => `/products/${id}`,

    // Reservations
    RESERVATIONS: '/reservations',

    // Orders
    ORDERS: '/orders',
    PAY_ORDER: (id: number) => `/orders/${id}/pay`,

    // Admin
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_RESERVATIONS: '/admin/reservations',
    ADMIN_AUDIT_LOGS: '/admin/audit-logs',
} as const;

// WebSocket Event Names
export const SOCKET_EVENTS = {
    // Stock
    STOCK_UPDATED: 'stock_updated',

    // Reservation
    RESERVATION_CREATED: 'reservation_created',
    RESERVATION_EXPIRED: 'reservation_expired',
    RESERVATION_RELEASED: 'reservation_released',

    // Order
    ORDER_CREATED: 'order_created',
    ORDER_PAID: 'order_paid',
    ORDER_EXPIRED: 'order_expired',
    ORDER_CANCELLED: 'order_cancelled',
} as const;

// Timing Constants
export const RESERVATION_TTL_MINUTES = 10;
export const PAYMENT_TTL_MINUTES = 5;

// Local Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'flash_sale_token',
    CART: 'flash_sale_cart',
} as const;
