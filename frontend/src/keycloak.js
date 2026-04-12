import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://secureai.local/auth",
  realm: "SecureAI",
  clientId: "backend-client",
});

export default keycloak;
