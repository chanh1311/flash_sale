'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS, SOCKET_EVENTS } from '@/constants';
import { formatDateTime } from '@/lib/utils';
import { useSocketEvent } from '@/hooks/useSocket';
import { Badge, PageSpinner, Button } from '@/components/ui';
import type { Reservation, ReservationStatus } from '@/types';

const RESERVATION_STATUSES = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'ACTIVE', label: 'Đang giữ' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'EXPIRED', label: 'Hết hạn' },
    { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
    const variants: Record<ReservationStatus, 'warning' | 'success' | 'danger' | 'default' | 'info'> = {
        ACTIVE: 'warning',
        COMPLETED: 'success',
        CANCELLED: 'danger',
        EXPIRED: 'default',
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
}

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL');

    // Fetch reservations
    const fetchReservations = async () => {
        try {
            const endpoint =
                statusFilter === 'ALL'
                    ? API_ENDPOINTS.ADMIN_RESERVATIONS
                    : `${API_ENDPOINTS.ADMIN_RESERVATIONS}?status=${statusFilter}`;
            const response = await api.get<Reservation[]>(endpoint);
            setReservations(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải danh sách giữ hàng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [statusFilter]);

    // Realtime updates
    useSocketEvent(SOCKET_EVENTS.RESERVATION_CREATED, () => fetchReservations(), [statusFilter]);
    useSocketEvent(SOCKET_EVENTS.RESERVATION_EXPIRED, () => fetchReservations(), [statusFilter]);
    useSocketEvent(SOCKET_EVENTS.RESERVATION_RELEASED, () => fetchReservations(), [statusFilter]);

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
                    Quản lý Giữ hàng ({reservations.length})
                </h1>

                <div className="flex items-center gap-4">
                    {/* Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'ALL')}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {RESERVATION_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>


                </div>
            </div>

            {reservations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Không có đơn giữ hàng nào</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Mã ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Người dùng
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Sản phẩm
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Hết hạn
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ngày tạo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {reservations.map((reservation) => (
                                <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium">#{reservation.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{reservation.userId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            {reservation.items?.map((item) => (
                                                <div key={item.id} className="text-xs">
                                                    <span className="font-medium">{item.product?.name || `Sản phẩm #${item.productId}`}</span>
                                                    <span className="text-gray-400 ml-1">x{item.quantity}</span>
                                                </div>
                                            )) || 'Không có sản phẩm'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <ReservationStatusBadge status={reservation.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                        {formatDateTime(reservation.expiresAt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                        {formatDateTime(reservation.createdAt)}
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
