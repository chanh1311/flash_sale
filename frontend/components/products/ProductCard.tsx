import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { StockBadge } from './StockBadge';
import { Card, CardContent } from '@/components/ui';
import type { Product } from '@/types';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const imageUrl = "https://cdn.tgdd.vn/Products/Images/42/329149/iphone-16-pro-max-sa-mac-thumb-1-600x600.jpg";

    return (
        <Link href={`/products/${product.id}`} className="group block">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>

                {/* Product Info */}
                <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                    <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(product.price)}
                    </p>
                    <StockBadge
                        availableStock={product.availableStock}
                        reservedStock={product.reservedStock}
                        soldStock={product.soldStock}
                    />
                </CardContent>
            </Card>
        </Link>
    );
}