import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/moviemate-logo.svg";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";

interface FormData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: string;
  id: string;
}

const Login = (): JSX.Element => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      // First login to get token
      const loginRes = await axios.post<LoginResponse>(
        "http://localhost:3001/api/users/login",
        formData
      );
      
      // Store auth data
      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("role", loginRes.data.role);
      localStorage.setItem("id", loginRes.data.id);

      // After successful login, fetch user details to get name and email
      try {
        const userRes = await axios.get(`http://localhost:3001/api/users/${loginRes.data.id}`, {
          headers: {
            Authorization: loginRes.data.token
          }
        });
        
        // Store additional user data
        if (userRes.data) {
          localStorage.setItem("userName", userRes.data.name || "User");
          localStorage.setItem("userEmail", userRes.data.email || "");
          console.log("User data stored:", userRes.data);
        }
      } catch (userError) {
        console.error("Error fetching user details:", userError);
        // Continue anyway, as we have the essential auth data
      }

      // Navigate based on role
      if (loginRes.data.role === "admin") {
        window.location.href = "/dashboard"; // More reliable navigation
      } else {
        window.location.href = "/"; // More reliable navigation
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Login failed");
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-8">
        <img
          src={logo}
          alt="MovieMate Logo"
          width={200}
          height={50}
          className="h-12 w-auto"
        />
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        Log in to your account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Enter your email"
            onChange={handleChange}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter your password"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Sign in
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Not a member?{" "}
        <Link
          to="/register"
          className="font-medium text-primary hover:text-primary-100"
        >
          Register now
        </Link>
      </p>
    </div>
  );
};

export default Login;