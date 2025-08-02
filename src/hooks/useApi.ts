// src/hooks/useApi.ts (Simplified)
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../auth-config";
// No need for useAppDispatch here if dispatchWithToken is removed

export const useApi = () => {
    const { instance, accounts } = useMsal();

    // getValidToken can remain here if it's used for non-Redux Toolkit API calls
    const getValidToken = async (): Promise<string | null> => {
        if (accounts.length === 0) {
            console.error("No account available for token acquisition.");
            return null;
        }

        const request = { ...loginRequest, account: accounts[0] };

        try {
            const response = await instance.acquireTokenSilent(request);
            return response.accessToken;
        } catch (error) {
            console.error("Token acquisition failed:", error);
            if (error instanceof InteractionRequiredAuthError) {
                instance.loginRedirect(loginRequest).catch(e => console.error(e));
            }
            return null;
        }
    };

    // dispatchWithToken is now removed as it's no longer necessary.
    // Thunks handle token acquisition internally.

    return { getValidToken }; // Only return getValidToken if needed externally
};