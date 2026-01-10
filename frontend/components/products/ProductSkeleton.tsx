import { Skeleton } from '@/components/ui';
import { Card, CardContent, CardFooter } from '@/components/ui';

export function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            {/* Image skeleton */}
            <Skeleton className="aspect-square w-full rounded-none" />

            <CardContent className="p-4">
                {/* Title skeleton */}
                <Skeleton className="h-5 w-3/4 mb-2" />

                {/* Price skeleton */}
                <Skeleton className="h-6 w-1/2 mb-3" />

                {/* Stock badges skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
