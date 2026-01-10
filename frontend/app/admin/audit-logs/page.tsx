'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { formatDateTime } from '@/lib/utils';
import { PageSpinner, Badge, Button } from '@/components/ui';
import type { AuditLog } from '@/types';

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch audit logs
    const fetchLogs = async () => {
        try {
            const response = await api.get<AuditLog[]>(API_ENDPOINTS.ADMIN_AUDIT_LOGS);
            setLogs(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể tải audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Auto-refresh mỗi 30s
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, []);

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
                    Audit Logs (Top 50)
                </h1>
                <Button variant="outline" onClick={fetchLogs}>
                    Refresh
                </Button>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Chưa có audit log nào</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Thời gian
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Action
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Entity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Người thực hiện
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ghi chú
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                        {formatDateTime(log.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="info">{log.action}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        <span className="font-medium">{log.resourceType}</span>
                                        <span className="text-gray-500"> #{log.resourceId}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                                        {log.user?.name || `User #${log.userId}`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                        {log.note || '-'}
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

