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

    keycloak
      .init({ onLoad: "check-sso", silentCheckSsoRedirectUri: undefined })
      .then((auth) => {
        setAuthenticated(auth);

        if (auth) {
          keycloak.loadUserProfile().then((p) => setProfile(p));

          // Token refresh every 55 seconds
          setInterval(() => {
            keycloak.updateToken(60).catch(() => keycloak.login());
          }, 55_000);
        }

        setLoading(false);
      })
      .catch(() => {
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
