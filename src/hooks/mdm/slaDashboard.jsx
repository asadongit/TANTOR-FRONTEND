import React, { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const useSLADashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [summary, setSummary] = useState(null);
    const [slaByTaskType, setSlaByTaskType] = useState([]);
    const [stewardPerformance, setStewardPerformance] = useState([]);
    const [stewardLeaderboard, setStewardLeaderboard] = useState([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/sla-confguration/dashboard');
            setSummary(data.summary ?? null);
            setSlaByTaskType(data.sla_by_task_type ?? []);
            setStewardPerformance(data.steward_performance ?? []);
            setStewardLeaderboard(data.steward_leaderboard ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return {
        isLoading,
        isError,
        summary,
        slaByTaskType,
        stewardPerformance,
        stewardLeaderboard,
        fetchData,
    };
};

export const useSLAConfiguration = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [slaConfig, setSlaConfig] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [toastError, setToastError] = useState(null);

    const fetchSLAConfig = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/sla-confguration/configure_sla');
            setSlaConfig(data.sla_configuration ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateSLAConfig = useCallback(async (slaId, payload) => {
        setIsUpdating(true);
        setToastError(null);
        try {
            await api.patch(`/mdm/sla-configuration/${slaId}`, {
                sla_updates: payload,
                notification_settings: {
                    "email_at_risk": true,
                    "dashboard_alert": true,
                    "auto_escalate": true
                },
            });
            await fetchSLAConfig();
        } catch (err) {
            const errorMsg = err?.response?.data?.detail ?? 'Failed to update SLA';
            setToastError(errorMsg);
            throw err;
        } finally {
            setIsUpdating(false);
        }
    }, [fetchSLAConfig]);

    return {
        isLoading,
        isError,
        slaConfig,
        fetchSLAConfig,
        updateSLAConfig,
        isUpdating,
        toastError,
        setToastError,
    };
};