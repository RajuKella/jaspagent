import axios from "axios";
import apiClient from "../api-client";



export const fetchAllDocuments = async (user_id:number) => {
    try {
        const response = await apiClient.post("/docs/list", {"user_id":String(user_id)});
        return response.data;
    } catch (error:any) {
            //axios error have a structured format
            if(axios.isAxiosError(error) && error.response){
                //server responded other than 2xx status code
                const errorData = error.response.data;
                throw new Error(errorData.message || `HTTP Error!! Status code: ${error.response.status}`);
            }else if (axios.isAxiosError(error) && error.request){
                //Request was made but no response recieved
                throw new Error("No response from the server");
            }else{
                throw new Error(`Error: ${error.message}`);
            }
    }
    
};

export const deleteDocument = async (doc_id:number, user_id:number) => {
    try {
        const response = await apiClient.post("/docs/delete-untrain", {
            "user_id":user_id,
            "doc_id":doc_id
        });
        return response.data;
    } catch (error:any) {
            //axios error have a structured format
            if(axios.isAxiosError(error) && error.response){
                //server responded other than 2xx status code
                const errorData = error.response.data;
                throw new Error(errorData.message || `HTTP Error!! Status code: ${error.response.status}`);
            }else if (axios.isAxiosError(error) && error.request){
                //Request was made but no response recieved
                throw new Error("No response from the server");
            }else{
                throw new Error(`Error: ${error.message}`);
            }
    }
    
};

export const uploadDocument = async (userId: number, file: File) => {
    try {
        // Create a FormData object to send the file and user_id
        const formData = new FormData();
        formData.append("user_id", userId.toString()); // Convert user_id to string as FormData appends strings
        formData.append("file", file); // Append the file itself

        const response = await apiClient.post("/docs/upload-train", formData, {
            headers: {
                // DO NOT set 'Content-Type': 'multipart/form-data' directly.
                // Axios will automatically add the boundary string when you pass FormData.
                // If you set it yourself, you might omit the boundary or set it incorrectly.
                // The best way is to DELETE the Content-Type header so Axios can set it itself.
                'Content-Type': undefined, // Or 'Content-Type': null, or simply omit it from the object
            },
        });
        return response.data;
    } catch (error: any) {
        // Axios error handling
        if (axios.isAxiosError(error) && error.response) {
            // The server responded with a status code other than 2xx
            const errorData = error.response.data;
            throw new Error(errorData.detail || `HTTP Error! Status code: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            // The request was made but no response was received
            throw new Error("No response from the server. Please check your network connection.");
        } else {
            // Something else happened while setting up the request
            throw new Error(`Error: ${error.message}`);
        }
    }
};

export const fetchDocumentStatus = async (doc_id: number, user_id: number) => {
    try {
        const response = await apiClient.get(`/docs/${doc_id}/status`, {
            params: { // Send user_id as a query parameter
                user_id: user_id 
            }
        });
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            throw new Error(errorData.detail || `HTTP Error! Status code: ${error.response.status}`);
        } else if (axios.isAxiosError(error) && error.request) {
            throw new Error("No response from the server for status check.");
        } else {
            throw new Error(`Error fetching status: ${error.message}`);
        }
    }
};