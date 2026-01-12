'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { API_ENDPOINTS, SOCKET_EVENTS } from '@/constants';
import { getSocket, connectSocket } from '@/lib/socket';
import { formatCurrency, formatRemainingTime, isExpired } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Badge, PageSpinner } from '@/components/ui';
import type { Reservation, Order, OrderStatus, ReservationStatus } from '@/types';

// Generate UUID cho idempotency key
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Component hiển thị countdown timer
function CountdownTimer({ deadline, onExpire }: { deadline: string; onExpire?: () => void }) {
    const [timeLeft, setTimeLeft] = useState(formatRemainingTime(deadline));

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = formatRemainingTime(deadline);
            setTimeLeft(remaining);

            if (remaining === 'Hết hạn' && onExpire) {
                onExpire();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline, onExpire]);

    const isExpiredNow = timeLeft === 'Hết hạn';

    return (
        <span className={`font-mono text-lg ${isExpiredNow ? 'text-red-500' : 'text-blue-600'}`}>
            {timeLeft}
        </span>
    );
}

// Status badge với màu sắc
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

function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
    const variants: Record<ReservationStatus, 'warning' | 'success' | 'danger' | 'default'> = {
        ACTIVE: 'warning',
        COMPLETED: 'success',
        CANCELLED: 'danger',
        EXPIRED: 'default',
    };

    const labels: Record<ReservationStatus, string> = {
        ACTIVE: 'Đang giữ',
        COMPLETED: 'Đã hoàn thành',
        CANCELLED: 'Đã hủy',
        EXPIRED: 'Hết hạn',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// Extended type for reservation with order
interface ReservationWithOrder extends Reservation {
    order: Order | null;
}

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const reservationId = searchParams.get('reservationId');

    const [reservation, setReservation] = useState<ReservationWithOrder | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect nếu chưa login
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/checkout');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch reservation data on page load
    useEffect(() => {
        if (!reservationId || !isAuthenticated) return;

        const fetchReservation = async () => {
            try {
                const response = await api.get<ReservationWithOrder>(
                    API_ENDPOINTS.RESERVATION_DETAIL(Number(reservationId))
                );
                setReservation(response.data);
                // If reservation already has an order, set it
                if (response.data.order) {
                    setOrder(response.data.order);
                }
            } catch (err: any) {
                const serverMessage = err.response?.data?.message;
                setError(serverMessage || 'Không thể tải thông tin giữ hàng');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservation();
    }, [reservationId, isAuthenticated]);

    // Subscribe realtime events
    useEffect(() => {
        connectSocket();
        const socket = getSocket();

        const handleOrderPaid = (event: { orderId: number }) => {
            if (order && event.orderId === order.id) {
                setOrder((prev) => prev ? { ...prev, status: 'PAID' as OrderStatus } : null);
            }
        };

        const handleOrderExpired = (event: { orderId: number }) => {
            if (order && event.orderId === order.id) {
                setOrder((prev) => prev ? { ...prev, status: 'EXPIRED' as OrderStatus } : null);
            }
        };

        socket.on(SOCKET_EVENTS.ORDER_PAID, handleOrderPaid);
        socket.on(SOCKET_EVENTS.ORDER_EXPIRED, handleOrderExpired);

        return () => {
            socket.off(SOCKET_EVENTS.ORDER_PAID, handleOrderPaid);
            socket.off(SOCKET_EVENTS.ORDER_EXPIRED, handleOrderExpired);
        };
    }, [order]);

    // Tạo order từ reservation
    const handleCreateOrder = async () => {
        if (!reservationId) return;

        setError(null);
        setIsCreatingOrder(true);

        try {
            const response = await api.post<Order>(API_ENDPOINTS.ORDERS, {
                reservationId: Number(reservationId),
                idempotencyKey: generateUUID(),
            });

            setOrder(response.data);
            // Update reservation status locally
            setReservation((prev) => prev ? { ...prev, status: 'COMPLETED' as ReservationStatus, order: response.data } : null);
        } catch (err: any) {
            const serverMessage = err.response?.data?.message;
            setError(serverMessage || 'Không thể tạo đơn hàng');
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // Thanh toán
    const handlePay = async () => {
        if (!order) return;

        setError(null);
        setIsPaying(true);

        try {
            const response = await api.post<Order>(API_ENDPOINTS.PAY_ORDER(order.id), {
                paymentIdempotencyKey: generateUUID(),
            });

            setOrder(response.data);
        } catch (err: any) {
            const serverMessage = err.response?.data?.message;
            setError(serverMessage || 'Thanh toán thất bại');
        } finally {
            setIsPaying(false);
        }
    };

    if (authLoading || isLoading) {
        return <PageSpinner />;
    }

    if (!reservationId) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Không tìm thấy thông tin giữ hàng</p>
                    <Button onClick={() => router.push('/')}>Về trang chủ</Button>
                </div>
            </div>
        );
    }

    // Helper: Check if reservation can create order
    const canCreateOrder = reservation?.status === 'ACTIVE' && !order;
    const reservationExpired = reservation?.status === 'EXPIRED';
    const reservationCancelled = reservation?.status === 'CANCELLED';

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Thanh toán
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            {/* Reservation Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Thông tin giữ hàng</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mã giữ hàng:</span>
                        <span className="font-medium">#{reservationId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Trạng thái:</span>
                        {reservation ? (
                            <div className="flex items-center gap-2">
                                <ReservationStatusBadge status={reservation.status} />
                                {reservation.status === 'ACTIVE' && !order && (
                                    <span className="text-sm font-mono text-orange-600 flex items-center gap-1">
                                        (Hết hạn sau:
                                        <CountdownTimer
                                            deadline={reservation.expiresAt.toString()}
                                            onExpire={() => setReservation(prev => prev ? { ...prev, status: 'EXPIRED' as ReservationStatus } : null)}
                                        />)
                                    </span>
                                )}
                            </div>
                        ) : (
                            <Badge variant="default">Đang tải...</Badge>
                        )}
                    </div>
                    {reservation?.items && reservation.items.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                            <span className="text-gray-500 block mb-2">Sản phẩm:</span>
                            {reservation.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs py-1">
                                    <span>{item.product?.name || `Product #${item.productId}`}</span>
                                    <span className="text-gray-400">x{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Show message if reservation is expired or cancelled */}
            {(reservationExpired || reservationCancelled) && !order && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-center py-4">
                        <div className="text-4xl mb-2">{reservationExpired ? '⏰' : '❌'}</div>
                        <p className="text-gray-500 font-semibold">
                            {reservationExpired ? 'Giữ hàng đã hết hạn' : 'Giữ hàng đã bị hủy'}
                        </p>
                        <Button variant="secondary" className="mt-4" onClick={() => router.push('/')}>
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            )}

            {/* Order Section - Only show create button if reservation is ACTIVE and no order exists */}
            {canCreateOrder && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold mb-4">Tạo đơn hàng</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Bấm nút bên dưới để tạo đơn hàng từ reservation. Sau khi tạo, bạn có 5 phút để hoàn tất thanh toán.
                    </p>
                    <Button
                        className="w-full"
                        onClick={handleCreateOrder}
                        isLoading={isCreatingOrder}
                        disabled={isCreatingOrder}
                    >
                        Tạo đơn hàng
                    </Button>
                </div>
            )}

            {/* Order Section - Show if order exists */}
            {order && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Đơn hàng #{order.id}</h2>
                        <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-3 text-sm mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tổng tiền:</span>
                            <span className="text-xl font-bold text-blue-600">
                                {formatCurrency(order.totalAmount)}
                            </span>
                        </div>

                        {order.status === 'PENDING_PAYMENT' && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Thời gian còn lại:</span>
                                <CountdownTimer
                                    deadline={new Date(new Date(order.createdAt).getTime() + 5 * 60 * 1000).toISOString()}
                                    onExpire={() => setOrder((prev) => prev ? { ...prev, status: 'EXPIRED' as OrderStatus } : null)}
                                />
                            </div>
                        )}
                    </div>

                    {order.status === 'PENDING_PAYMENT' && (
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePay}
                            isLoading={isPaying}
                            disabled={isPaying}
                        >
                            Thanh toán ngay
                        </Button>
                    )}

                    {order.status === 'PAID' && (
                        <div className="text-center py-4">
                            <p className="text-green-600 font-semibold">Thanh toán thành công!</p>
                            <Button variant="secondary" className="mt-4" onClick={() => router.push('/')}>
                                Tiếp tục mua sắm
                            </Button>
                        </div>
                    )}

                    {order.status === 'EXPIRED' && (
                        <div className="text-center py-4">
                            <p className="text-red-500 font-semibold">Đơn hàng đã hết hạn thanh toán</p>
                            <Button variant="secondary" className="mt-4" onClick={() => router.push('/')}>
                                Về trang chủ
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
