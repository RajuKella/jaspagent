// src/auth-config.ts (or msalConfig.ts)

import { LogLevel, type Configuration } from "@azure/msal-browser";

// NO dotenv.config() here! Vite handles it.
// Access environment variables using import.meta.env
const VITE_AZURE_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
const VITE_AZURE_AUTHORITY = import.meta.env.VITE_AZURE_AUTHORITY;
const VITE_AZURE_REDIRECT_URI = import.meta.env.VITE_AZURE_REDIRECT_URI;
const VITE_AZURE_POST_LOGOUT_REDIRECT_URI = import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI;
const VITE_AZURE_API_SCOPE = import.meta.env.VITE_AZURE_API_SCOPE;


// Basic validation (optional, but recommended)
// You might want to make these assertions stronger if you're certain they will always be defined.
if (!VITE_AZURE_CLIENT_ID || !VITE_AZURE_AUTHORITY || !VITE_AZURE_REDIRECT_URI || !VITE_AZURE_POST_LOGOUT_REDIRECT_URI || !VITE_AZURE_API_SCOPE) {
    console.error("Missing one or more Azure AD environment variables. Please check your .env file and ensure they are prefixed with VITE_.");
    // Depending on your application's robustness, you might want to:
    // throw new Error("Critical environment variables are missing.");
}


export const msalConfig: Configuration = {
    auth:{
        clientId: VITE_AZURE_CLIENT_ID as string,
        authority: VITE_AZURE_AUTHORITY as string,
        redirectUri : VITE_AZURE_REDIRECT_URI as string,
        postLogoutRedirectUri : VITE_AZURE_POST_LOGOUT_REDIRECT_URI as string
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                switch(level) {
                    case LogLevel.Error: console.error(message); return;
                    case LogLevel.Info: console.info(message); return;
                    case LogLevel.Verbose: console.debug(message); return;
                    case LogLevel.Warning: console.warn(message); return;
                }
            }
        }
    }
};

export const loginRequest = {
    scopes: [
        "openid",
        "profile",
        "email",
        VITE_AZURE_API_SCOPE as string
    ]
};