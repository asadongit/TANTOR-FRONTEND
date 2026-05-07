import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const useReviewHistoryHomepage = () => {
    const [counts, setCounts] = useState({
        total_reviewed:  0,
        merged:          0,
        not_duplicate:   0,
        held_deferred:   0,
        avg_review_time: '—',
    });
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError]     = useState(false);

    const fetchHomepage = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/review_history/homepage');
            setCounts(data.counts ?? {});
            setReviews(data.reviews ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomepage();
    }, [fetchHomepage]);

    return { counts, reviews, isLoading, isError, fetchHomepage };
};



export const useReviewHistoryDetails = () => {
    const [details, setDetails]     = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDetails = async (taskId) => {
        setIsLoading(true);
        try {
            const { data } = await api.get(`/mdm/review_history/details/${taskId}`);
            setDetails(data);
        } catch {
            setDetails(null);
        } finally {
            setIsLoading(false);
        }
    };

    return { details, isLoading, fetchDetails };
};