import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in min-h-screen bg-gradient-to-br from-primary-grey to-secondary-grey font-sans">
      {/* Hero Section */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12 lg:px-20">
        <div className="flex w-full max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-20">
          {/* Left — Copy */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-dark-navy sm:text-5xl lg:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-dark-navy to-slate-600 bg-clip-text text-transparent">
                secureMS
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-dark-navy/70 sm:text-xl">
              Next-generation microservices protection powered by AI-driven
              anomaly detection and zero-trust identity management.
            </p>

            <button
              onClick={() => navigate("/portal")}
              className="mt-10 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-dark-navy px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-dark-navy/50 focus:ring-offset-2 active:translate-y-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Authenticate
            </button>
          </div>

          {/* Right — Hero Image */}
          <div className="flex flex-1 items-center justify-center">
            <img
              src="https://res.cloudinary.com/dxbsk2eml/image/upload/q_auto/f_auto/v1775823551/logopfa-removebg-preview_1_a55mbe.png"
              alt="SecureMS platform illustration"
              className="animate-float w-full max-w-md drop-shadow-2xl lg:max-w-lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
