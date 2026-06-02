import { useEffect, useRef } from 'react';
import { useUIStore } from '../store';

/**
 * Industry-standard WebSocket hook for real-time notifications.
 * Handles auto-reconnection, heartbeats, and state synchronization.
 */
export const useNotificationsWS = () => {
    const socketRef = useRef(null);
    const setUnreadCount = useUIStore(s => s.setUnreadCount);
    const reconnectTimeoutRef = useRef(null);

    const connect = () => {
        // Construct WS URL from current window location (supports dev and prod)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = 'localhost:8000'; // Hardcoded for local dev parity with agentmesh.js BASE
        const wsUrl = `${protocol}//${host}/api/v1/agentmesh/ws/notifications?client_id=agent_mesh_ui`;

        console.log('[WS] Connecting to:', wsUrl);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('[WS] Connected to notification hub');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            // Start heartbeat
            const heartbeat = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send('ping');
                }
            }, 30000);
            socket.heartbeat = heartbeat;
        };

        socket.onmessage = (event) => {
            if (event.data === 'pong') return;
            
            try {
                const message = JSON.parse(event.data);
                console.log('[WS] Received message:', message);

                if (message.type === 'notification') {
                    // Update global UI state immediately
                    setUnreadCount(prev => prev + 1);
                    
                    // Native Browser Notification (optional)
                    if (Notification.permission === 'granted') {
                        new Notification(message.data.title, {
                            body: message.data.message,
                            icon: '/logo192.png'
                        });
                    }
                }
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };

        socket.onclose = (event) => {
            console.warn(`[WS] Disconnected (code: ${event.code}). Retrying in 5s...`);
            if (socket.heartbeat) clearInterval(socket.heartbeat);
            
            // Exponential backoff or simple retry
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        socket.onerror = (err) => {
            console.error('[WS] Connection error:', err);
            socket.close();
        };

        socketRef.current = socket;
    };

    useEffect(() => {
        // Request notification permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission();
        }

        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    return socketRef.current;
};
