// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <div className="bg-white text-gray-800 rounded-3xl shadow-2xl p-12 w-full max-w-md text-center space-y-6">
        <h1 className="text-4xl font-extrabold">Welcome to LMS</h1>
        <p className="text-gray-600 text-lg">
          Manage leaves, balances, and reports seamlessly for your team.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-200"
        >
          Proceed to Login
        </button>
      </div>
      <footer className="mt-12 text-white/80">
        © {new Date().getFullYear()} LMS. All rights reserved.
      </footer>
    </div>
  );
}
