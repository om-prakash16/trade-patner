import { useState, useEffect } from 'react';
import axios from 'axios';

import { StockData } from '@/lib/types';

export const useMarketData = () => {
    const [data, setData] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8000";

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/god-mode`);
            if (res.data.status === "success") {
                setData(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 5000);
        return () => clearInterval(interval);
    }, []);

    return { data, loading, fetchData };
};
