import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Portal() {
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleKeycloakLogin() {
    login();
  }

  return (
    <div className="animate-fade-in flex min-h-screen font-sans">
      {/* ── Left Column — Full-Bleed Image (60%) ── */}
      <div className="relative hidden lg:block lg:w-[60%]">
        <img
          src="https://res.cloudinary.com/dxbsk2eml/image/upload/q_auto/f_auto/v1776004338/yuuh_mmv6ig.jpg"
          alt="Abstract security visualization"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Subtle depth overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      </div>

      {/* ── Right Column — Content Panel (40%) ── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-gradient-to-br from-primary-grey to-secondary-grey lg:w-[40%]">
        {/* Subtle branding — top center */}
        <p className="absolute top-8 text-xs font-medium tracking-[0.25em] text-dark-navy/30 uppercase">
          SecureMS
        </p>

        {/* Back link — top right */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-7 right-8 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-dark-navy/50 transition-colors duration-200 hover:text-dark-navy"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        {/* Centered content */}
        <div className="flex flex-col items-center px-8 text-center sm:px-14 lg:px-12 xl:px-16">
          <p className="text-sm font-medium tracking-wide text-dark-navy/50">
            Start your journey
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-dark-navy xl:text-5xl">
            Access the{" "}
            <span className="bg-gradient-to-r from-dark-navy to-slate-600 bg-clip-text text-transparent">
              MicroShield
            </span>
          </h1>

          <p className="mt-5 max-w-xs text-base font-medium leading-relaxed text-dark-navy/55">
            Sign in through your identity provider to reach the security
            dashboard.
          </p>

          {/* Authenticate Button — pill shape */}
          <button
            onClick={handleKeycloakLogin}
            className="mt-10 inline-flex cursor-pointer items-center gap-3 rounded-full bg-dark-navy px-10 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-dark-navy/50 focus:ring-offset-2 active:translate-y-0 active:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                clipRule="evenodd"
              />
            </svg>
            Authenticate with Keycloak
          </button>

          <p className="mt-8 text-xs font-medium text-dark-navy/35">
            Protected by zero-trust identity management
          </p>
        </div>
      </div>
    </div>
  );
}

export default Portal;
