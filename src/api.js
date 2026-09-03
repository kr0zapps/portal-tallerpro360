import { msalInstance, apiRequest } from "./authConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

/**
 * Interceptor para peticiones a la API protegida (Actividad 1.3.2).
 * Obtiene el token silenciosamente y lo adjunta en la cabecera Authorization: Bearer <token>.
 */
export async function apiFetch(url, opciones = {}) {
  const cuenta = msalInstance.getAllAccounts()[0];
  if (!cuenta) {
    throw new Error("No hay sesión iniciada");
  }

  let resultado;
  try {
    resultado = await msalInstance.acquireTokenSilent({
      ...apiRequest,
      account: cuenta
    });
    // Log para verificar el token según la actividad 1.3.1
    console.log("Access Token obtenido:", resultado.accessToken);
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      console.warn("Fallo adquisición silenciosa, redirigiendo para interacción...");
      await msalInstance.acquireTokenRedirect(apiRequest);
      return;
    } else {
      throw e;
    }
  }

  return fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${resultado.accessToken}`
    }
  });
}
