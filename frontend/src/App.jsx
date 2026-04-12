import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage.jsx";
import Portal from "./pages/Portal.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const { authenticated, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={authenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route
        path="/portal"
        element={authenticated ? <Navigate to="/dashboard" replace /> : <Portal />}
      />
      <Route
        path="/dashboard"
        element={authenticated ? <Dashboard /> : <Navigate to="/portal" replace />}
      />
    </Routes>
  );
}

export default App;
