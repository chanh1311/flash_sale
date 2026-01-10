'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { XIcon } from 'lucide-react';
import type { Reservation } from '@/types';

// Generate UUID cho idempotency key
function generateUUID(): string {
    return self.crypto.randomUUID();
}

export default function CartPage() {
    const router = useRouter();
    const { items, itemCount, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
    const { isAuthenticated } = useAuth();

    const [isReserving, setIsReserving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReserve = async () => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/cart');
            return;
        }

        if (items.length === 0) return;

        setError(null);
        setIsReserving(true);

        try {
            const response = await api.post<Reservation>(API_ENDPOINTS.RESERVATIONS, {
                items: items.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                })),
                idempotencyKey: generateUUID(),
            });

            // Xóa cart sau khi reservation thành công
            clearCart();

            // Chuyển đến trang checkout với reservation ID
            router.push(`/checkout?reservationId=${response.data.id}`);
        } catch (err: any) {
            const serverMessage = err.response?.data?.message;
            setError(serverMessage || 'Không thể giữ hàng. Vui lòng thử lại.');
        } finally {
            setIsReserving(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Giỏ hàng
                </h1>
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Giỏ hàng của bạn đang trống
                    </p>
                    <Button onClick={() => router.push('/')}>Tiếp tục mua sắm</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Giỏ hàng ({itemCount} sản phẩm)
            </h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <Card key={item.product.id} className="relative p-4">
                            <div className="flex gap-4">
                                {/* Product Image */}
                                <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                                    <Image
                                        src="https://cdn.tgdd.vn/Products/Images/42/329149/iphone-16-pro-max-sa-mac-thumb-1-600x600.jpg"
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                </div>

                                {/* Product Info & Controls Grid */}
                                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 pr-8">
                                            {item.product.name}
                                        </h3>
                                        <p className="text-blue-600 font-semibold">
                                            {formatCurrency(item.product.price)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Còn {item.product.availableStock} sản phẩm
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            −
                                        </Button>
                                        <span className="w-8 text-center font-medium text-sm">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                            disabled={item.quantity >= item.product.availableStock}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.product.id)}
                                className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                aria-label="Xóa sản phẩm"
                            >
                                <XIcon className="size-4" />
                            </Button>
                        </Card>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Tóm tắt đơn hàng</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Số lượng</span>
                                <span>{itemCount} sản phẩm</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                <span>Tổng cộng</span>
                                <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleReserve}
                                isLoading={isReserving}
                                disabled={isReserving}
                            >
                                Giữ hàng (10 phút)
                            </Button>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                Sau khi giữ hàng, bạn có 10 phút để hoàn tất thanh toán
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

