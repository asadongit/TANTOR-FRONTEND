import { useEffect, useRef, useCallback } from 'react';
import { getBackendUrl } from '../api/agentmesh';
import { useRunStatusStore } from '../store/runStatusStore';

/**
 * useRunStatusWS — real-time workflow run-status via WebSocket push.
 *
 * Single long-lived socket per editor (n8n-style push channel). The backend
 * pushes `run_progress` events as nodes start/finish; on (re)connect and on
 * tab-visibility regain we take ONE rev-gated `/active-runs?since=` snapshot
 * to reconcile state. No polling.
 *
 * Returns `runningNodes` — a Set of node ids currently executing for `workflowId`.
 */
export const useRunStatusWS = ({ workflowId, clientId = 'agent_mesh_ui' }) => {
    const runningNodes = useRunStatusStore((s) => s.runningNodes);
    const setRunningNodes = useRunStatusStore((s) => s.setRunningNodes);
    const socketRef = useRef(null);
    const reconnectRef = useRef(null);
    const heartbeatRef = useRef(null);
    const lastRevRef = useRef(0);
    const disposedRef = useRef(false);

    const applySnapshot = useCallback((activeRuns) => {
        const next = new Set();
        Object.values(activeRuns || {}).forEach((run) => {
            if (run.workflow_id === workflowId) {
                (run.active_nodes || []).forEach((id) => next.add(id));
            }
        });
        setRunningNodes((prev) => {
            const changed =
                prev.size !== next.size || [...prev].some((id) => !next.has(id));
            return changed ? next : prev;
        });
    }, [workflowId, setRunningNodes]);

    const fetchSnapshot = useCallback(async () => {
        try {
            const backend = getBackendUrl();
            const res = await fetch(
                `${backend}/api/v1/agentmesh/active-runs?since=${lastRevRef.current}`,
            );
            const data = await res.json();
            if (data.status === 'success') {
                lastRevRef.current = data.revision || 0;
                if (data.changed) applySnapshot(data.active_runs);
            }
        } catch {
            // Offline — the socket's reconnect path will reconcile on reconnect.
        }
    }, [applySnapshot]);

    useEffect(() => {
        if (!workflowId) return undefined;
        disposedRef.current = false;
        lastRevRef.current = 0;
        setRunningNodes(new Set());

        const backend = getBackendUrl();
        const wsUrl = `${backend.replace(/^http/, 'ws')}/api/v1/agentmesh/ws/notifications?client_id=${encodeURIComponent(clientId)}&workflow_id=${encodeURIComponent(workflowId)}`;

        const connect = () => {
            if (disposedRef.current) return;
            let socket;
            try {
                socket = new WebSocket(wsUrl);
            } catch {
                reconnectRef.current = setTimeout(connect, 5000);
                return;
            }
            socketRef.current = socket;

            socket.onopen = () => {
                if (reconnectRef.current) {
                    clearTimeout(reconnectRef.current);
                    reconnectRef.current = null;
                }
                // Reconcile state against the authoritative snapshot.
                fetchSnapshot();

                // Heartbeat so proxies don't idle-timeout the socket.
                heartbeatRef.current = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send('ping');
                    }
                }, 30000);
            };

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'connected') {
                        fetchSnapshot();
                        return;
                    }
                    if (msg.type !== 'run_progress') return;
                    lastRevRef.current = msg.revision ?? lastRevRef.current;
                    if (msg.workflow_id !== workflowId) return;
                    setRunningNodes((prev) => {
                        const next = new Set(prev);
                        if (msg.status === 'running') next.add(msg.node_id);
                        else next.delete(msg.node_id);
                        return next.size === prev.size ? prev : next;
                    });
                } catch {
                    // Ignore malformed frames (e.g. 'pong' text).
                }
            };

            socket.onclose = () => {
                if (heartbeatRef.current) {
                    clearInterval(heartbeatRef.current);
                    heartbeatRef.current = null;
                }
                if (disposedRef.current) return;
                reconnectRef.current = setTimeout(connect, 5000);
            };

            socket.onerror = () => {
                try {
                    socket.close();
                } catch {
                    // noop
                }
            };
        };

        connect();

        // Reconcile when the tab regains visibility (suspended-tab catch-up).
        const onVisibility = () => {
            if (document.visibilityState === 'visible') fetchSnapshot();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            disposedRef.current = true;
            document.removeEventListener('visibilitychange', onVisibility);
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            if (socketRef.current) {
                try {
                    socketRef.current.close();
                } catch {
                    // noop
                }
            }
            socketRef.current = null;
        };
    }, [workflowId, clientId, fetchSnapshot, setRunningNodes]);

    return { runningNodes };
};
