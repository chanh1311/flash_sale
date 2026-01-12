'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SOCKET_EVENTS } from '@/constants';
import { getSocket, connectSocket } from '@/lib/socket';
import { formatCurrency, formatRemainingTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Badge, PageSpinner } from '@/components/ui';
import type { Reservation, OrderStatus, ReservationStatus } from '@/types';

// Component hiển thị countdown timer
function CountdownTimer({ deadline }: { deadline: string }) {
    const [timeLeft, setTimeLeft] = useState(formatRemainingTime(deadline));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(formatRemainingTime(deadline));
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    const isExpiredNow = timeLeft === 'Hết hạn';
    return (
        <span className={`font-mono text-sm ${isExpiredNow ? 'text-red-500' : 'text-blue-600'}`}>
            {timeLeft}
        </span>
    );
}

// Order Status Badge
function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const variants: Record<OrderStatus, 'warning' | 'success' | 'danger' | 'default'> = {
        PENDING_PAYMENT: 'warning',
        PAID: 'success',
        CANCELLED: 'danger',
        EXPIRED: 'default',
    };
    const labels: Record<OrderStatus, string> = {
        PENDING_PAYMENT: 'Chờ thanh toán',
        PAID: 'Đã thanh toán',
        CANCELLED: 'Đã hủy',
        EXPIRED: 'Hết hạn',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// Reservation Status Badge
function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
    const variants: Record<ReservationStatus, 'warning' | 'success' | 'danger' | 'default'> = {
        ACTIVE: 'warning',
        COMPLETED: 'success',
        CANCELLED: 'danger',
        EXPIRED: 'default',
    };
    const labels: Record<ReservationStatus, string> = {
        ACTIVE: 'Đang giữ',
        COMPLETED: 'Đã tạo đơn',
        CANCELLED: 'Đã hủy',
        EXPIRED: 'Hết hạn',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

interface ReservationWithOrder extends Reservation {
    order?: any; // or Order type if available
}

export default function MyReservationsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [reservations, setReservations] = useState<ReservationWithOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/reservations');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchReservations = async () => {
            try {
                // Fetch list from NEW endpoint
                const res = await api.get<ReservationWithOrder[]>('/reservations');
                setReservations(res.data);
            } catch (err) {
                console.error('Failed to fetch reservations', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            fetchReservations();
        }
    }, [isAuthenticated, authLoading]);

    // Real-time Updates
    useEffect(() => {
        if (!isAuthenticated) return;

        connectSocket();
        const socket = getSocket();

        const handleReservationExpired = (event: { reservationId: number }) => {
            setReservations((prev) =>
                prev.map((r) =>
                    r.id === event.reservationId ? { ...r, status: 'EXPIRED' as ReservationStatus } : r
                )
            );
        };

        const handleOrderPaid = (event: { orderId: number }) => {
            setReservations((prev) =>
                prev.map((r) =>
                    r.order?.id === event.orderId
                        ? { ...r, order: { ...r.order, status: 'PAID' as OrderStatus } }
                        : r
                )
            );
        };

        const handleOrderExpired = (event: { orderId: number }) => {
            setReservations((prev) =>
                prev.map((r) =>
                    r.order?.id === event.orderId
                        ? { ...r, order: { ...r.order, status: 'EXPIRED' as OrderStatus } }
                        : r
                )
            );
        };

        const handleOrderCancelled = (event: { orderId: number }) => {
            setReservations((prev) =>
                prev.map((r) =>
                    r.order?.id === event.orderId
                        ? { ...r, order: { ...r.order, status: 'CANCELLED' as OrderStatus } }
                        : r
                )
            );
        };

        // If a new order is created, we might not have reservationId in event payload to map it easily
        // But we can just refetch the list to be safe and accurate
        const handleOrderCreated = () => {
            // Re-fetch to get updated list with new order info
            const fetchReservations = async () => {
                try {
                    const res = await api.get<ReservationWithOrder[]>('/reservations');
                    setReservations(res.data);
                } catch (err) {
                    console.error('Failed to reload reservations', err);
                }
            };
            fetchReservations();
        };

        socket.on(SOCKET_EVENTS.RESERVATION_EXPIRED, handleReservationExpired);
        socket.on(SOCKET_EVENTS.ORDER_PAID, handleOrderPaid);
        socket.on(SOCKET_EVENTS.ORDER_EXPIRED, handleOrderExpired);
        socket.on(SOCKET_EVENTS.ORDER_CANCELLED, handleOrderCancelled);
        socket.on(SOCKET_EVENTS.ORDER_CREATED, handleOrderCreated);

        return () => {
            socket.off(SOCKET_EVENTS.RESERVATION_EXPIRED, handleReservationExpired);
            socket.off(SOCKET_EVENTS.ORDER_PAID, handleOrderPaid);
            socket.off(SOCKET_EVENTS.ORDER_EXPIRED, handleOrderExpired);
            socket.off(SOCKET_EVENTS.ORDER_CANCELLED, handleOrderCancelled);
            socket.off(SOCKET_EVENTS.ORDER_CREATED, handleOrderCreated);
        };
    }, [isAuthenticated]);

    if (authLoading || isLoading) {
        return <PageSpinner />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Đơn hàng của tôi
                </h1>
                <Button variant="outline" onClick={() => router.push('/')}>
                    Tiếp tục mua sắm
                </Button>
            </div>

            {reservations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
                    <Button onClick={() => router.push('/')}>Mua ngay</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {reservations.map((res) => {
                        const hasExpired = new Date(res.expiresAt) < new Date();
                        // Active logic: Status Active AND Not Expired AND No Order created yet
                        // Note: Backend might define status logic differently, but visually for user:
                        const isReservationActive = res.status === 'ACTIVE' && !res.order && !hasExpired;

                        return (
                            <div
                                key={res.id}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-6 border transition-all hover:shadow-md
                                    ${isReservationActive ? 'border-blue-200 shadow-sm' : 'border-gray-200'}
                                `}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="font-semibold text-lg">Mã #{res.id}</span>
                                            {res.order ? (
                                                <OrderStatusBadge status={res.order.status} />
                                            ) : (
                                                <ReservationStatusBadge status={res.status} />
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-500 mb-3">
                                            Ngày tạo: {new Date(res.createdAt).toLocaleString('vi-VN')}
                                        </p>

                                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 space-y-2">
                                            {res.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {item.product?.name || `Sản phẩm #${item.productId}`}
                                                    </span>
                                                    <span className="text-gray-500">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-center gap-3 min-w-[200px]">
                                        {/* Action Buttons Logic */}

                                        {/* 1. Reservation Active -> Show 'Tạo đơn hàng' */}
                                        {isReservationActive && (
                                            <>
                                                <div className="text-sm text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                                    Hết hạn sau: <CountdownTimer deadline={res.expiresAt.toString()} />
                                                </div>
                                                <Button
                                                    className="w-full"
                                                    onClick={() => router.push(`/checkout?reservationId=${res.id}`)}
                                                >
                                                    Tạo đơn hàng
                                                </Button>
                                            </>
                                        )}

                                        {/* 2. Order Created & Pending Payment -> Show 'Thanh toán ngay' */}
                                        {res.order && res.order.status === 'PENDING_PAYMENT' && (
                                            <>
                                                <div className="text-sm text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                                    Hết hạn sau:
                                                    {/* Tính deadline dựa trên order createdAt */}
                                                    <CountdownTimer deadline={new Date(new Date(res.order.createdAt).getTime() + 5 * 60 * 1000).toISOString()} />
                                                </div>
                                                <Button
                                                    className="w-full"
                                                    onClick={() => router.push(`/checkout?reservationId=${res.id}`)}
                                                >
                                                    Thanh toán ngay
                                                </Button>
                                                <p className="text-sm text-gray-500 font-bold">
                                                    {formatCurrency(res.order.totalAmount)}
                                                </p>
                                            </>
                                        )}

                                        {/* 3. Order Paid -> Show 'Chi tiết' or similar */}
                                        {res.order && res.order.status === 'PAID' && (
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => router.push(`/checkout?reservationId=${res.id}`)}
                                            >
                                                Xem chi tiết
                                            </Button>
                                        )}

                                        {/* 4. Expired/Cancelled -> Show Status text */}
                                        {!isReservationActive && !res.order && (
                                            <span className="text-sm text-gray-400 italic">
                                                {res.status === 'CANCELLED' ? 'Đã hủy bỏ' : 'Đã hết thời gian giữ hàng'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
