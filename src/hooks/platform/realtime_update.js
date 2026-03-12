import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Custom hook for handling real-time WebSocket updates for a specific table.
 * @param {string} tableName - The name of the table to listen for updates (e.g., 'migration', 'etl', 'purge').
 * @param {function} onUpdate - Callback function to execute when an update for the specified table is received.
 */
export const useRealtimeUpdate = (tableName, onUpdate) => {
    const { decodedToken, hostnameV2 } = useAuth();
    const onUpdateRef = useRef(onUpdate);

    // Update the ref whenever onUpdate changes, without re-triggering the effect
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (decodedToken?.preferred_username && hostnameV2) {
            const username = decodedToken.preferred_username;
            const protocol = hostnameV2.startsWith('https') ? 'wss' : 'ws';
            const wsUrl = `${hostnameV2.replace(/^https?:\/\//, `${protocol}://`)}/ws/${username}`;

            let socket;
            let reconnectTimer;
            let isComponentMounted = true;

            const connect = () => {
                if (!isComponentMounted) return;

                console.log(`[Realtime] Attempting connection for ${tableName} to ${wsUrl}`);
                socket = new WebSocket(wsUrl);

                socket.onopen = () => {
                    if (isComponentMounted) {
                        console.log(`[Realtime] WebSocket connected for user: ${username}, table: ${tableName}`);
                    }
                };

                socket.onmessage = (event) => {
                    if (!isComponentMounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        console.log(`[Realtime] Notification received for user ${username}:`, data);

                        if (data.table === tableName) {
                            console.log(`[Realtime] Table match: ${tableName}. Triggering update callback.`);
                            if (onUpdateRef.current) {
                                onUpdateRef.current(data);
                            }
                        } else {
                            console.log(`[Realtime] Table mismatch: expected ${tableName}, got ${data.table}.`);
                        }
                    } catch (error) {
                        console.error("[Realtime] Error parsing WebSocket message:", error);
                    }
                };

                socket.onclose = (event) => {
                    if (!isComponentMounted) return;

                    console.log(`[Realtime] WebSocket closed for ${tableName}. Event code: ${event.code}`);
                    // reconnection logic
                    if (event.code !== 1000) {
                        reconnectTimer = setTimeout(connect, 5000);
                    }
                };

                socket.onerror = (error) => {
                    if (!isComponentMounted) return;
                    console.error(`[Realtime] WebSocket error for ${tableName}:`, error);
                    socket.close();
                };
            };

            connect();

            return () => {
                isComponentMounted = false;
                if (socket) {
                    socket.onclose = null; // Prevent reconnection on unmount
                    socket.close();
                }
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                }
            };
        }
    }, [decodedToken, hostnameV2, tableName]);
};
