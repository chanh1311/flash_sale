'use client';

import { toast } from 'sonner';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { API_ENDPOINTS, SOCKET_EVENTS } from '@/constants';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { StockBadge } from '@/components/products/StockBadge';
import { Button, PageSpinner } from '@/components/ui';
import type { Product, StockUpdatedEvent } from '@/types';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addItem } = useCart();
    const productId = Number(params.id);

    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get<Product>(API_ENDPOINTS.PRODUCT_DETAIL(productId));
                setProduct(response.data);
            } catch (err) {
                setError('Không tìm thấy sản phẩm');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    // Subscribe to realtime stock updates với useSocketEvent hook
    useSocketEvent<StockUpdatedEvent>(
        SOCKET_EVENTS.STOCK_UPDATED,
        (event) => {
            // Chỉ update nếu productId khớp
            if (event.productId === productId) {
                setProduct((prev) =>
                    prev
                        ? {
                            ...prev,
                            availableStock: event.availableStock,
                            reservedStock: event.reservedStock,
                            soldStock: event.soldStock,
                        }
                        : null
                );
            }
        },
        [productId]
    );

    // Handle add to cart
    // Handle add to cart (Stay on page)
    const handleAddToCart = useCallback(() => {
        if (!product) return;
        addItem(product, quantity);
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
    }, [product, quantity, addItem]);

    // Handle buy now (Redirect to cart)
    const handleBuyNow = useCallback(() => {
        if (!product) return;
        addItem(product, quantity);
        router.push('/cart');
    }, [product, quantity, addItem, router]);

    if (isLoading) {
        return <PageSpinner />;
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <p className="text-red-500">{error || 'Sản phẩm không tồn tại'}</p>
                    <Button variant="secondary" className="mt-4" onClick={() => router.push('/')}>
                        Về trang chủ
                    </Button>
                </div>
            </div>
        );
    }

    const maxQuantity = product.availableStock;
    const canAddToCart = product.availableStock > 0 && quantity <= maxQuantity;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                {/* Product Image */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                        src="https://cdn.tgdd.vn/Products/Images/42/329149/iphone-16-pro-max-sa-mac-thumb-1-600x600.jpg"
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {product.name}
                        </h1>
                        <p className="mt-2 text-4xl font-bold text-blue-600">
                            {formatCurrency(product.price)}
                        </p>
                    </div>

                    {/* Stock Info - Realtime */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Tình trạng kho (Realtime)
                        </h3>
                        <StockBadge
                            availableStock={product.availableStock}
                            reservedStock={product.reservedStock}
                            soldStock={product.soldStock}
                            showDetails
                        />
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Số lượng:
                        </label>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                −
                            </Button>
                            <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                                {quantity}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                                disabled={quantity >= maxQuantity}
                            >
                                +
                            </Button>
                        </div>
                        <span className="text-sm text-gray-500">
                            (Tối đa {maxQuantity})
                        </span>
                    </div>

                    {/* Buttons: Buy Now & Add to Cart */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="flex-1"
                            disabled={!canAddToCart}
                            onClick={handleAddToCart}
                        >
                            Thêm vào giỏ hàng
                        </Button>
                        <Button
                            size="lg"
                            className="flex-1"
                            disabled={!canAddToCart}
                            onClick={handleBuyNow}
                        >
                            {product.availableStock <= 0 ? 'Hết hàng' : 'Mua ngay'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
