'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';

interface AdminNavLinkProps {
    href: string;
    children: React.ReactNode;
}

function AdminNavLink({ href, children }: AdminNavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                'block px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
        >
            {children}
        </Link>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const { isConnected } = useSocketContext();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="text-gray-500">Đang tải...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Yêu cầu đăng nhập
                </h1>
                <p className="text-gray-500 mb-4">
                    Bạn cần đăng nhập để truy cập trang Admin.
                </p>
                <Link href="/login?redirect=/admin" className="text-blue-600 hover:underline">
                    Đăng nhập ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Mobile Navigation - horizontal scroll */}
            <div className="lg:hidden mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Admin Panel
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span
                            className={cn(
                                'w-2 h-2 rounded-full',
                                isConnected ? 'bg-green-500' : 'bg-red-500'
                            )}
                        />
                        <span className="text-gray-500 hidden sm:inline">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
                <nav className="flex gap-2 overflow-x-auto pb-2">
                    <AdminNavLink href="/admin/orders">Orders</AdminNavLink>
                    <AdminNavLink href="/admin/reservations">Reservations</AdminNavLink>
                    <AdminNavLink href="/admin/audit-logs">Logs</AdminNavLink>
                </nav>
            </div>

            <div className="flex gap-8">
                {/* Sidebar - hidden on mobile */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Admin Panel
                        </h2>

                        {/* Connection Status */}
                        <div className="mb-4 flex items-center gap-2 text-sm">
                            <span
                                className={cn(
                                    'w-2 h-2 rounded-full',
                                    isConnected ? 'bg-green-500' : 'bg-red-500'
                                )}
                            />
                            <span className="text-gray-500">
                                {isConnected ? 'Realtime connected' : 'Disconnected'}
                            </span>
                        </div>

                        <nav className="space-y-1">
                            <AdminNavLink href="/admin/orders">Danh sách Orders</AdminNavLink>
                            <AdminNavLink href="/admin/reservations">Danh sách Reservations</AdminNavLink>
                            <AdminNavLink href="/admin/audit-logs">Audit Logs</AdminNavLink>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}

