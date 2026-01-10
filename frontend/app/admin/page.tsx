'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
    const router = useRouter();

    // Redirect to orders page by default
    useEffect(() => {
        router.replace('/admin/orders');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <span className="text-gray-500">Đang chuyển hướng...</span>
        </div>
    );
}
