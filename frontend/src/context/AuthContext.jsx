import { createContext, useContext, useState, useEffect, useRef } from "react";
import keycloak from "../keycloak";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Timeout: if Keycloak hangs for >4s, proceed unauthenticated
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("[Auth] Keycloak init timed out — proceeding without SSO");
        setAuthenticated(false);
        setLoading(false);
      }
    }, 4000);

    // Expose for axios interceptor (avoids circular import)
    window.__keycloak = keycloak;

    keycloak
      .init({ onLoad: "check-sso", silentCheckSsoRedirectUri: undefined })
      .then((auth) => {
        clearTimeout(timeout);
        setAuthenticated(auth);

        if (auth) {
          keycloak.loadUserProfile().then((p) => setProfile(p)).catch(() => {});
        }

        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.warn("[Auth] Keycloak init failed:", err);
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

  function login() {
    keycloak.login();
  }

  function logout() {
    keycloak.logout({ redirectUri: window.location.origin });
  }

  const roles =
    keycloak.tokenParsed?.realm_access?.roles?.filter(
      (r) => !r.startsWith("default-roles-") && r !== "offline_access" && r !== "uma_authorization"
    ) ?? [];

  const value = {
    authenticated,
    profile,
    loading,
    roles,
    token: keycloak.token,
    tokenParsed: keycloak.tokenParsed,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
