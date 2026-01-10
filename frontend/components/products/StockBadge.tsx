import { cn } from '@/lib/utils';

interface StockBadgeProps {
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    showDetails?: boolean;
    className?: string;
}

/**
 * Badge hiển thị tình trạng stock với màu sắc tương ứng
 */
export function StockBadge({
    availableStock,
    reservedStock,
    soldStock,
    showDetails = false,
    className,
}: StockBadgeProps) {
    // Xác định variant dựa trên available stock
    const getVariant = () => {
        if (availableStock <= 0) return 'danger';
        if (availableStock <= 5) return 'warning';
        return 'success';
    };

    const variant = getVariant();

    const variantStyles = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    if (showDetails) {
        return (
            <div className={cn('space-y-1 text-sm', className)}>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 w-20">Có sẵn:</span>
                    <span className={cn('px-2 py-0.5 rounded font-medium', variantStyles[variant])}>
                        {availableStock}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 w-20">Đang giữ:</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{reservedStock}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 w-20">Đã bán:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{soldStock}</span>
                </div>
            </div>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                variantStyles[variant],
                className
            )}
        >
            {availableStock <= 0 ? 'Hết hàng' : `Còn ${availableStock}`}
        </span>
    );
}
