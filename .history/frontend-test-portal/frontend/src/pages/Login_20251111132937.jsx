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
        </div
        
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
