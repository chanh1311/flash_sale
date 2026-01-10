'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';

/**
 * Hook để subscribe một socket event
 * Tự động cleanup khi component unmount
 */
export function useSocketEvent<T>(
    eventName: string,
    callback: (data: T) => void,
    deps: React.DependencyList = []
) {
    const { socket, isConnected } = useSocketContext();
    const callbackRef = useRef(callback);

    // Update callback ref khi callback thay đổi
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handler = (data: T) => {
            callbackRef.current(data);
        };

        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, isConnected, eventName, ...deps]);
}

/**
 * Hook để subscribe nhiều socket events cùng lúc
 */
export function useSocketEvents(
    subscriptions: Array<{ event: string; handler: (data: unknown) => void }>
) {
    const { socket, isConnected } = useSocketContext();

    useEffect(() => {
        if (!socket || !isConnected) return;

        subscriptions.forEach(({ event, handler }) => {
            socket.on(event, handler);
        });

        return () => {
            subscriptions.forEach(({ event, handler }) => {
                socket.off(event, handler);
            });
        };
    }, [socket, isConnected, subscriptions]);
}

/**
 * Hook để emit socket event
 */
export function useSocketEmit() {
    const { socket, isConnected } = useSocketContext();

    const emit = useCallback(
        (eventName: string, data?: unknown) => {
            if (socket && isConnected) {
                socket.emit(eventName, data);
            }
        },
        [socket, isConnected]
    );

    return emit;
}
