import axios from "axios";
import apiClient from "../api-client"; // Import the shared Axios instance with the interceptor


export const fetchUserProfile = async () => {
    try {
        const response = await apiClient.get("/users/login");
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

