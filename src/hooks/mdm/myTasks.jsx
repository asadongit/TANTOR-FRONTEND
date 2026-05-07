import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

//  My Tasks Homepage
export const useMyTasksHomepage = (user) => {
    const [counts, setCounts] = useState({
        assigned_to_me: 0,
        in_progress: 0,
        overdue: 0,
        completed_today: 0,
    });
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchHomepage = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.post('/mdm/my_tasks/homepage', { user });
            setCounts(data.counts ?? {});
            setTasks(data.tasks ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchHomepage();
    }, [fetchHomepage]);

    return { counts, tasks, isLoading, isError, fetchHomepage };
};