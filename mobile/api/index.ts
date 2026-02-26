import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL points to the live Render Backend
export const API_URL = 'https://be-bhair.onrender.com/api/v1';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle global errors (e.g. 401 Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If the token expires or is invalid
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('userToken');
            // In a real app, you might want to dispatch a logout action
            // to your global state here if possible, or emit an event.
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
