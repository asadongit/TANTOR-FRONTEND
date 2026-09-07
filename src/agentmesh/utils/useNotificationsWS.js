import { useEffect, useRef } from 'react';
import { useUIStore } from '../store';
import { getBackendUrl } from '../api/agentmesh';
import { getAgentMeshAccessToken } from '../api/authenticatedFetch';

/**
 * Industry-standard WebSocket hook for real-time notifications.
 * Handles auto-reconnection, heartbeats, and state synchronization.
 */
export const useNotificationsWS = () => {
    const socketRef = useRef(null);
    const setUnreadCount = useUIStore(s => s.setUnreadCount);
    const reconnectTimeoutRef = useRef(null);
    const disposedRef = useRef(false);

    const connect = async () => {
        if (disposedRef.current) return;
        const backend = getBackendUrl();
        const wsUrl = `${backend.replace(/^http/, 'ws')}/api/v1/agentmesh/ws/notifications?client_id=agent_mesh_ui`;

        console.log('[WS] Connecting to:', wsUrl);
        let token;
        try {
            token = await getAgentMeshAccessToken();
        } catch (err) {
            console.error('[WS] Unable to refresh the access token:', err);
        }
        if (!token || disposedRef.current) {
            if (disposedRef.current) return;
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
            return;
        }

        const socket = new WebSocket(wsUrl, ['agentmesh', token]);

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
            if (disposedRef.current) return;

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
        disposedRef.current = false;
        // Request notification permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission();
        }

        connect();

        return () => {
            disposedRef.current = true;
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
