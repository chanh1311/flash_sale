'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    lastEventTimestamp: string | null;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    lastEventTimestamp: null,
});

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(null);

    useEffect(() => {
        // Tạo socket connection
        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        // Event handlers
        socketInstance.on('connect', () => {
            console.log('[Socket] Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
        });

        // Track last event timestamp for deduplication
        socketInstance.onAny((eventName, data) => {
            if (data?.timestamp) {
                setLastEventTimestamp(data.timestamp);
            }
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, lastEventTimestamp }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext(): SocketContextType {
    return useContext(SocketContext);
}
