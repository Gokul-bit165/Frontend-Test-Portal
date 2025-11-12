import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login({ isAdmin = false, onLogin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!credentials.username || !credentials.password) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const adminEndpoint = "http://localhost:5000/api/auth/admin/login";
      const userEndpoint = "http://localhost:5000/api/auth/login";
      const endpoints = isAdmin
        ? [adminEndpoint, userEndpoint]
        : [userEndpoint, adminEndpoint];
      let response;

      console.log("Is Admin:", isAdmin);

      for (let i = 0; i < endpoints.length; i += 1) {
        const url = endpoints[i];
        const isLastAttempt = i === endpoints.length - 1;

        console.log("Attempting login to:", url);

        try {
          response = await axios.post(url, credentials);
          break;
        } catch (err) {
          const isAuthError = err.response?.status === 401;
          if (!isAuthError || isLastAttempt) {
            throw err;
          }
          console.warn("Login attempt failed on:", url, err.response?.data);
        }
      }

      if (!response) {
        setError("Login failed. Please try again.");
        return;
      }

      const { user, token } = response.data || {};
      const role = user?.role;
      const normalizedRole = typeof role === "string" ? role.toLowerCase() : "";

      console.log("Login response:", response.data);
      console.log("Resolved role:", role);

      if (!user || !token || !normalizedRole) {
        setError("Invalid response from server. Please try again.");
        return;
      }

      localStorage.setItem("userRole", normalizedRole);

      if (normalizedRole === "admin") {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", JSON.stringify(user));
        localStorage.setItem("userToken", token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("username", user.username);

        console.log("Admin token stored, calling onLogin");

        if (onLogin) {
          onLogin({ role: normalizedRole, user, token });
        }

        setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 100);
        return;
      }

      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.username);
      localStorage.setItem("userToken", token);

      console.log("User token stored");

      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err.response);

      if (err.response) {
        // Server responded with error
        setError(
          err.response.data?.error ||
            err.response.data?.message ||
            "Login failed. Please try again."
        );
      } else if (err.request) {
        // Request made but no response
        setError(
          "Cannot connect to server. Please check if the backend is running."
        );
      } else {
        // Something else happened
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isAdmin
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}
    >
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1
            className={`text-4xl font-bold mb-2 ${
              isAdmin ? "text-white" : "text-gray-900"
            }`}
          >
            {isAdmin ? "Admin Portal" : "Frontend Test Portal"}
          </h1>
          <p className={isAdmin ? "text-gray-400" : "text-gray-600"}>
            {isAdmin
              ? "Frontend Test Platform Management"
              : "Sign in to continue learning"}
          </p>
        </div>

        {/* <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isAdmin ? "Admin Login" : "Student Login"}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none ${
                  isAdmin ? "focus:ring-gray-500" : "focus:ring-indigo-500"
                }`}
                placeholder={
                  isAdmin ? "Enter admin username" : "Enter your username"
                }
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none ${
                  isAdmin ? "focus:ring-gray-500" : "focus:ring-indigo-500"
                }`}
                placeholder={
                  isAdmin ? "Enter admin password" : "Enter your password"
                }
                autoComplete="current-password"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdmin
                  ? "bg-gray-900 hover:bg-gray-800"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Demo Credentials:
                <br />
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  admin / admin123
                </span>
              </p>
            </div>
          )}
          <div
            className={`text-center ${
              isAdmin ? "mt-4" : "mt-6 pt-6 border-t border-gray-200"
            }`}
          >
            <button
              onClick={() => navigate(isAdmin ? "/login" : "/admin/login")}
              className={`text-sm font-medium transition-colors ${
                isAdmin
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-indigo-600 hover:text-indigo-700"
              }`}
            >
              {isAdmin ? "← Back to Student Login" : "Admin Login →"}
            </button>
          </div>
        </div> */}

        {/* Help Text (Student Only) */}
        {!isAdmin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? Contact your administrator
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
