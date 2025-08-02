// src/api-client.ts (or wherever you configure Axios)
import axios from 'axios';
import { getAccessToken } from './auth-utils'; // Import the getAccessToken function


const apiClient = axios.create({
    baseURL: "http://127.0.0.1:8000/jasp-api", // Replace with your actual API base URL
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        try {
            const accessToken = await getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        } catch (error) {
            // Handle the error from getAccessToken, e.g., if InteractionRequiredAuthError was thrown and redirected
            console.error("Failed to attach access token to request:", error);
            // You might want to do more specific error handling here,
            // like dispatching a Redux action to show an error message or force a logout.
            return Promise.reject(error);
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;