'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShoppingCart, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { StockBadge } from './StockBadge';
import { Card, CardContent, Button } from '@/components/ui';
import type { Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const { addItem } = useCart();
    const imageUrl = "https://cdn.tgdd.vn/Products/Images/42/329149/iphone-16-pro-max-sa-mac-thumb-1-600x600.jpg";

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation if inside one, though we separated them
        e.stopPropagation();
        addItem(product, 1);
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1);
        router.push('/cart');
    };

    const isOutOfStock = product.availableStock <= 0;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 flex flex-col h-full group">
            {/* Product Image Link */}
            <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </Link>

            {/* Product Info */}
            <CardContent className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex-1 space-y-2">
                    <Link href={`/products/${product.id}`} className="block">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 min-h-[3rem]">
                            {product.name}
                        </h3>
                    </Link>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(product.price)}
                    </p>
                    <StockBadge
                        availableStock={product.availableStock}
                        reservedStock={product.reservedStock}
                        soldStock={product.soldStock}
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 mt-auto">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                    >

                        <span className="hidden sm:inline">Thêm Vào Giỏ</span>
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                    >
                        <span className="hidden sm:inline">Mua Ngay</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}