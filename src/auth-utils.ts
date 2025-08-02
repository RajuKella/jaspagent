// src/auth-utils.ts
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./auth-config";

export const msalInstance = new PublicClientApplication(msalConfig);

// THIS IS THE CRUCIAL ADDITION
// Initialize the MSAL instance. This must be awaited before any MSAL API calls.
msalInstance.initialize().then(() => {
    console.log("MSAL instance initialized.");
}).catch(error => {
    console.error("Failed to initialize MSAL instance:", error);
});


export const getAccessToken = async () => {
    // Now, when getAccessToken is called, msalInstance should already be initialized.
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
        msalInstance.acquireTokenRedirect(loginRequest);
        throw new Error("No user account found. Please log in.");
    }

    const activeAccount = accounts[0];

    const request = {
        ...loginRequest,
        account: activeAccount,
    };

    try {
        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            console.warn("Interaction required to get a new token. Redirecting for login...", error);
            msalInstance.acquireTokenRedirect(request);
            throw error;
        } else {
            console.error("Error acquiring token silently:", error);
            throw error;
        }
    }
};

export const logout = () => {
    msalInstance.logoutRedirect();
};