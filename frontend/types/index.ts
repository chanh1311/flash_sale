/**
 * TypeScript Types cho Flash Sale Frontend
 */

//  User & Auth 
export interface User {
    id: number;
    email: string;
    name: string;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

//  Product 
export interface Product {
    id: number;
    name: string;
    price: number;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    createdAt: string;
    updatedAt: string;
}

//  Cart 
export interface CartItem {
    product: Product;
    quantity: number;
}

// Reservation 
export enum ReservationStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export interface ReservationItem {
    id: number;
    productId: number;
    quantity: number;
    product?: Product;
}

export interface Reservation {
    id: number;
    userId: number;
    status: ReservationStatus;
    expiresAt: string;
    items: ReservationItem[];
    createdAt: string;
}

//  Order 
export enum OrderStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

export interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    product?: Product;
}

export interface Order {
    id: number;
    userId: number;
    reservationId: number;
    status: OrderStatus;
    totalAmount: number;
    paymentDeadline: string;
    items: OrderItem[];
    createdAt: string;
    paidAt?: string;
}

//  Audit Log 
export interface AuditLog {
    id: number;
    action: string;
    resourceType: string;
    resourceId: string;
    userId: number;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    payload: Record<string, unknown>;
    note?: string;
    createdAt: string;
}

//  API Response 
export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
}

//  WebSocket Events 
export interface StockUpdatedEvent {
    productId: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    timestamp: string;
}

export interface ReservationCreatedEvent {
    reservationId: number;
    userId: number;
    items: Array<{ productId: number; quantity: number }>;
    timestamp: string;
}

export interface ReservationExpiredEvent {
    reservationId: number;
    timestamp: string;
}

export interface ReservationReleasedEvent {
    reservationId: number;
    reason: string;
    timestamp: string;
}

export interface OrderCreatedEvent {
    orderId: number;
    userId: number;
    totalAmount: number;
    timestamp: string;
}

export interface OrderPaidEvent {
    orderId: number;
    timestamp: string;
}

export interface OrderExpiredEvent {
    orderId: number;
    timestamp: string;
}

export interface OrderCancelledEvent {
    orderId: number;
    timestamp: string;
}
