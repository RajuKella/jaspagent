import axios from "axios";
import apiClient from "../../api-client";


/**
 * Fetches the list of chat sessions for a user.
 * @param userId - The ID of the user.
 * @returns The user's chat session history.
 */
export const fetchChatHistoryApi = async (userId: string) => {
    try {
        const response = await apiClient.get("/history/sessions", {
            params: {
                user_id: userId
            }
        });
        return response.data;
    } catch (error: any) {
        // Axios errors have a structured format which we can use for better error messages
        if (axios.isAxiosError(error) && error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorData = error.response.data;
            throw new Error(errorData.detail || `HTTP Error! Status: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            // The request was made but no response was received
            throw new Error("No response from the server. Please check your network connection.");
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error(`Error: ${error.message}`);
        }
    }
};

/**
 * Fetches the full conversation for a specific chat session.
 * @param sessionId - The ID of the chat session.
 * @param userId - The ID of the user.
 * @returns The detailed conversation for the session.
 */
export const fetchChatConversationApi = async (
    sessionId: string,
    userId: string,
) => {
    try {
        // Use the apiClient to make the GET request
        const response = await apiClient.get(`history/sessions/${sessionId}/chats`, {
            params: {
                user_id: userId // Pass user_id as a query parameter
            }
        });
        // Axios automatically parses the JSON response, so we return response.data
        return response.data;
    } catch (error: any) {
        // Re-use the same robust error handling structure
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            throw new Error(errorData.detail || `HTTP Error! Status: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            throw new Error("No response from the server. Please check your network connection.");
        } else {
            throw new Error(`Error: ${error.message}`);
        }
    }
};

export const generateImages = async (
    sessionId: string,
    userId: string,
    userInput:string,
) => {
    try {
        // Use the apiClient to make the GET request
        const response = await apiClient.post(`image_generation/generate-image`, {
            "user_id":userId, "session_id":sessionId, "user_input":userInput
        });
        // Axios automatically parses the JSON response, so we return response.data
        return response.data;
    } catch (error: any) {
        // Re-use the same robust error handling structure
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            throw new Error(errorData.detail || `HTTP Error! Status: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            throw new Error("No response from the server. Please check your network connection.");
        } else {
            throw new Error(`Error: ${error.message}`);
        }
    }
};