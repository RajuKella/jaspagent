// services/adminUsers.ts
import axios from "axios";
import apiClient from "../api-client"; // Import the shared Axios instance with the interceptor

// Define the payload for updateLimit
interface UpdateLimitPayload {
    total_documents_allowed: number;
    documents_uploaded: number;
}

export const fetchAllUser = async (userId: string) => { // Removed 'token' parameter
    try {
        // Use apiClient instead of adminApiClient
        // The Authorization header is now handled by the interceptor in apiClient
        const response = await apiClient.post("/users/list", { "user_id": userId });
        return response.data;
    } catch (error: any) {
        // Error handling remains similar, as apiClient will pass through errors
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            throw new Error(errorData.message || `HTTP ERROR!! Status code: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            throw new Error("No response from the server");
        } else {
            throw new Error(`Error: ${error.message}`);
        }
    }
};


export const updateLimit = async (userId: number, data: UpdateLimitPayload) => { // Removed 'token' parameter
    try {
        // Use apiClient instead of adminApiClient
        // The Authorization header is now handled by the interceptor in apiClient
        const response = await apiClient.put(`/users/${userId}/update/limit`, data); // 'Content-Type' is also handled by apiClient defaults
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            throw new Error(errorData.detail || errorData.message || `HTTP ERROR!! Status code: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            throw new Error("No response from the server");
        } else {
            throw new Error(`Error: ${error.message}`);
        }
    }
};

export const deleteUser = async (userId: number) => { // Removed 'token' parameter
    try {
        // Use apiClient instead of adminApiClient
        // The Authorization header is now handled by the interceptor in apiClient
        const response = await apiClient.delete(`/users/${userId}/delete`); // 'Content-Type' is also handled by apiClient defaults
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            throw new Error(errorData.detail || errorData.message || `HTTP ERROR!! Status code: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            throw new Error("No response from the server");
        } else {
            throw new Error(`Error: ${error.message}`);
        }
    }
};