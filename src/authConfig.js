import { PublicClientApplication } from "@azure/msal-browser";

const tenantSubdomain = "felipelota";
const tenantId = "be58d838-d9c0-4ba4-8e40-305f14a63928";
const portalClientId = "a78f62f9-ab5e-455e-b83f3c45f5c2";
export const apiClientId = "737b63d0-530b-43d9-860a-fa9f2eddfd52";

export const msalConfig = {
  auth: {
    clientId: portalClientId,
    authority: `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`,
    knownAuthorities: [
      `${tenantSubdomain}.ciamlogin.com`,
      `${tenantId}.ciamlogin.com`
    ],
    redirectUri: window.location.origin + window.location.pathname,
    postLogoutRedirectUri: window.location.origin + window.location.pathname,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: "sessionStorage"
  }
};

// Scopes de OpenID Connect para el login
export const loginRequest = {
  scopes: ["openid", "profile", "email", "offline_access"]
};

// Scopes específicos de la API (Actividad 1.3.1 y 1.3.2)
export const apiRequest = {
  scopes: [`api://${apiClientId}/Ordenes.Leer`]
};

export const msalInstance = new PublicClientApplication(msalConfig);
