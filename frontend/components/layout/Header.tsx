'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
        >
            {children}
        </Link>
    );
}

export function Header() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-blue-600">Flash Sale</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-4">
                        <NavLink href="/">Sản phẩm</NavLink>
                        <NavLink href="/cart">Giỏ hàng</NavLink>
                        <NavLink href="/reservations">Đơn hàng của tôi</NavLink>
                        <NavLink href="/admin">Admin</NavLink>
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {isLoading ? (
                            <span className="text-sm text-gray-500">...</span>
                        ) : isAuthenticated ? (
                            <>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Xin chào, <strong>{user?.email}</strong>
                                </span>
                                <Button variant="outline" size="sm" onClick={logout}>
                                    Đăng xuất
                                </Button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}
