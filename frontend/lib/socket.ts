/**
 * Socket.IO Client cho Flash Sale Frontend
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '@/constants';

let socket: Socket | null = null;

/**
 * Khởi tạo và trả về Socket.IO client instance
 * Singleton pattern - chỉ tạo một connection duy nhất
 */
export function getSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false, // Không auto-connect
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
    }
    return socket;
}

/**
 * Connect socket
 */
export function connectSocket(): void {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
    if (socket?.connected) {
        socket.disconnect();
    }
}

/**
 * Subscribe một event với callback
 * Trả về function để unsubscribe
 */
export function subscribeEvent<T>(
    eventName: string,
    callback: (data: T) => void
): () => void {
    const s = getSocket();
    s.on(eventName, callback);

    return () => {
        s.off(eventName, callback);
    };
}

/**
 * Subscribe nhiều events cùng lúc
 * Trả về function để unsubscribe tất cả
 */
export function subscribeEvents(
    subscriptions: Array<{ event: string; callback: (data: unknown) => void }>
): () => void {
    const s = getSocket();

    subscriptions.forEach(({ event, callback }) => {
        s.on(event, callback);
    });

    return () => {
        subscriptions.forEach(({ event, callback }) => {
            s.off(event, callback);
        });
    };
}

// Re-export event names for convenience
export { SOCKET_EVENTS };
