'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { STORAGE_KEYS } from '@/constants';
import type { Product, CartItem } from '@/types';

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    totalAmount: number;
    addItem: (product: Product, quantity: number) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart từ localStorage khi mount
    useEffect(() => {
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch {
                // Invalid JSON, reset cart
                localStorage.removeItem(STORAGE_KEYS.CART);
            }
        }
        setIsInitialized(true);
    }, []);

    // Lưu cart vào localStorage khi thay đổi
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
        }
    }, [items, isInitialized]);

    const addItem = useCallback((product: Product, quantity: number) => {
        setItems((prev) => {
            const existingIndex = prev.findIndex((item) => item.product.id === product.id);

            if (existingIndex >= 0) {
                // Update quantity
                const newItems = [...prev];
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newItems[existingIndex].quantity + quantity,
                };
                return newItems;
            }

            // Add new item
            return [...prev, { product, quantity }];
        });
    }, []);

    const removeItem = useCallback((productId: number) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: number, quantity: number) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((item) => item.product.id !== productId));
            return;
        }

        setItems((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    // Computed values
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                totalAmount,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
