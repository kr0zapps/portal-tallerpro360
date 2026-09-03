import React, { useState, useEffect } from "react";
import { msalInstance, loginRequest, apiRequest } from "./authConfig";
import { apiFetch } from "./api";

// URL de la API:
// En la nube (AWS API Gateway): "https://awgixcuqq1.execute-api.us-east-1.amazonaws.com/ordenes"
// En local (Spring Boot, Actividad 1.3.3): "http://localhost:8080/api/ordenes"
const API_URL = "https://awgixcuqq1.execute-api.us-east-1.amazonaws.com/ordenes";

export default function App() {
  const [account, setAccount] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [estadoCarga, setEstadoCarga] = useState("cargando");
  const [errorDetalle, setErrorDetalle] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await msalInstance.initialize();
        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
          setAccount(response.account);
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.error("Error al inicializar autenticación:", err);
        setGlobalError(err.message || "Error al conectar con el proveedor de identidad");
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const cargarOrdenes = async () => {
    setEstadoCarga("cargando");
    setErrorDetalle("");
    try {
      // Actividad 1.3.2: Llamada mediante el interceptor apiFetch
      const res = await apiFetch(API_URL);
      if (!res) return; // Si redirigió por InteractionRequiredAuthError
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText || "Error en la petición"}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrdenes(data);
        setEstadoCarga("listo");
      } else {
        console.error("La respuesta no es un arreglo:", data);
        throw new Error("El formato de respuesta no es un arreglo válido");
      }
    } catch (err) {
      console.error("Error al obtener órdenes:", err);
      setErrorDetalle(err.message || "No se pudo conectar con la API");
      setEstadoCarga("error");
    }
  };

  useEffect(() => {
    if (account) {
      cargarOrdenes();
      
      // Actividad 1.3.1 - Parte E: Imprimir Access Token por consola para inspeccionar en jwt.ms
      msalInstance.acquireTokenSilent({
        ...apiRequest,
        account: account
      }).then(res => {
        console.log("=== TOKEN PARA ACTIVIDAD 1.3.1 ===");
        console.log("ID Token (aud = portal):", account.idToken);
        console.log("Access Token (aud = API):", res.accessToken);
        console.log("==================================");
      }).catch(err => {
        console.warn("No se pudo obtener access token silencioso para log inicial:", err);
      });
    }
  }, [account]);

  const handleLogin = async () => {
    try {
      setGlobalError(null);
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Error en login:", err);
      setGlobalError(err.message || "No se pudo iniciar sesión");
    }
  };

  const handleLogout = async () => {
    try {
      await msalInstance.logoutRedirect();
    } catch (err) {
      console.error("Error en logout:", err);
      setGlobalError(err.message || "Error al cerrar sesión");
    }
  };

  const obtenerNombreUsuario = () => {
    if (!account) return "";
    const claims = account.idTokenClaims || {};
    return claims.name || claims.preferred_username || claims.email || claims.given_name || account.name || account.username || "Técnico";
  };

  const obtenerEmailUsuario = () => {
    if (!account) return "";
    const claims = account.idTokenClaims || {};
    return claims.email || claims.preferred_username || claims.upn || account.username || "Sin correo registrado";
  };

  if (initializing) {
    return (
      <div className="center-container">
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Cargando portal TallerPro360...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {globalError && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">??</span>
            <span>{globalError}</span>
          </div>
          <button className="error-close" onClick={() => setGlobalError(null)}>×</button>
        </div>
      )}

      {account ? (
        <div className="portal-container">
          <header className="portal-header">
            <div className="header-left">
              <div className="user-avatar">{obtenerNombreUsuario().charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <h2 className="user-greeting">Hola, {obtenerNombreUsuario()}</h2>
                <span className="user-email">{obtenerEmailUsuario()}</span>
              </div>
            </div>
            <div className="header-right">
              <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </header>

          <main className="portal-main">
            <div className="content-card">
              <div className="section-title-row">
                <div>
                  <h3 className="section-title">ÓRDENES ASIGNADAS</h3>
                  <p className="section-subtitle">Datos consumidos desde API Gateway + AWS Lambda</p>
                </div>
                <div className="actions-header">
                  <button className="btn-reload" onClick={cargarOrdenes} title="Recargar órdenes">
                    ?? Recargar
                  </button>
                </div>
              </div>

              {estadoCarga === "cargando" && (
                <div className="state-box loading-box">
                  <div className="spinner"></div>
                  <p>Cargando órdenes de trabajo desde la API...</p>
                </div>
              )}

              {estadoCarga === "error" && (
                <div className="state-box error-box">
                  <div className="error-icon-big">?</div>
                  <h4>Error al obtener órdenes de trabajo</h4>
                  <p className="error-msg-detail">{errorDetalle || "No se pudo comunicar con el endpoint de API Gateway."}</p>
                  <p className="error-hint">
                    Verifica que tu API en AWS esté activa, que la ruta <code>/ordenes</code> tenga la integración Lambda adjunta y que CORS esté configurado.
                  </p>
                  <button className="btn-secondary" onClick={cargarOrdenes}>Reintentar</button>
                </div>
              )}

              {estadoCarga === "listo" && (
                <div className="orders-table-wrapper">
                  {ordenes.length === 0 ? (
                    <div className="empty-box">
                      <p>No hay órdenes de trabajo disponibles en este momento.</p>
                    </div>
                  ) : (
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Descripción del trabajo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenes.map((item) => (
                          <tr key={item.id || Math.random()}>
                            <td className="order-code"><code>{item.id}</code></td>
                            <td className="order-desc">{item.descripcion}</td>
                            <td>
                              <span className={`status-pill status-${(item.estado || "general").toLowerCase().replace(/\s+/g, "-")}`}>
                                {item.estado || "Desconocido"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            <div className="identity-card">
              <details className="claims-inspector">
                <summary className="claims-summary">
                  ?? Información del ID Token (Claims recibidos de Entra External ID)
                </summary>
                <div className="claims-content">
                  <pre>{JSON.stringify(account.idTokenClaims, null, 2)}</pre>
                </div>
              </details>
            </div>
          </main>

          <footer className="portal-footer">
            <p>TallerPro360 · Actividad 1.2.11 Cloud Native · AWS API Gateway + Lambda & Azure Entra ID</p>
          </footer>
        </div>
      ) : (
        <div className="center-container">
          <div className="card access-card">
            <div className="brand-header">
              <div className="logo-badge">??</div>
              <h1 className="portal-title">TallerPro360</h1>
              <p className="portal-subtitle">Portal de técnicos</p>
            </div>
            <div className="card-body">
              <p className="access-info">
                Bienvenido al sistema de gestión de taller. Por favor, autentícate con tu cuenta para acceder a tus órdenes de trabajo asignadas.
              </p>
              <button className="btn-primary" onClick={handleLogin}>
                <svg className="login-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                Iniciar sesión
              </button>
            </div>
            <div className="card-footer">
              <p className="security-notice">?? Acceso exclusivo para personal autorizado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
