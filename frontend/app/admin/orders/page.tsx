'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS, SOCKET_EVENTS } from '@/constants';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useSocketEvent } from '@/hooks/useSocket';
import { Badge, PageSpinner, Button } from '@/components/ui';
import type { Order, OrderStatus } from '@/types';

const ORDER_STATUSES = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'EXPIRED', label: 'Hết hạn' },
    { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const variants: Record<OrderStatus, 'warning' | 'success' | 'danger' | 'default'> = {
        PENDING_PAYMENT: 'warning',
        PAID: 'success',
        CANCELLED: 'danger',
        EXPIRED: 'default',
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

    // Fetch orders
    const fetchOrders = async () => {
        try {
            const endpoint =
                statusFilter === 'ALL'
                    ? API_ENDPOINTS.ADMIN_ORDERS
                    : `${API_ENDPOINTS.ADMIN_ORDERS}?status=${statusFilter}`;
            const response = await api.get<Order[]>(endpoint);
            setOrders(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    // Realtime updates
    useSocketEvent(SOCKET_EVENTS.ORDER_CREATED, () => fetchOrders(), [statusFilter]);
    useSocketEvent(SOCKET_EVENTS.ORDER_PAID, () => fetchOrders(), [statusFilter]);
    useSocketEvent(SOCKET_EVENTS.ORDER_EXPIRED, () => fetchOrders(), [statusFilter]);
    useSocketEvent(SOCKET_EVENTS.ORDER_CANCELLED, () => fetchOrders(), [statusFilter]);

    if (isLoading) {
        return <PageSpinner />;
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Quản lý Đơn hàng ({orders.length})
                </h1>

                <div className="flex items-center gap-4">
                    {/* Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {ORDER_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>


                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Không có đơn hàng nào</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mã đơn
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Người dùng
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tổng tiền
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ngày tạo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium">#{order.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{order.userId}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                        {formatCurrency(order.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                        {formatDateTime(order.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
