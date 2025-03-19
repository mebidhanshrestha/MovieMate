import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Ensure axios is installed: npm install axios

// Define interface for user data
interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("id");

        if (!token || !userId) {
          console.log("No token or userId found, redirecting to login");
          navigate("/login");
          return;
        }

        console.log("Token and userId found, fetching user data");

        const response = await axios.get(
          `http://localhost:3001/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("API Response:", response.data); // Debugging API response

        setUser({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role || "user",
        });
        setLoading(false);
      } catch (err) {
        console.error("Error in profile component:", err);

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            localStorage.clear();
            navigate("/login");
          } else {
            setError(
              err.response?.data?.message || "Failed to fetch user data"
            );
          }
        } else {
          setError("An unknown error occurred");
        }

        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-2 bg-primary text-white px-4 py-1 rounded-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-primary py-6 px-8">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>

        <div className="px-8 py-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    {user?.name || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    {user?.email || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account ID
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 truncate">
                    {user?._id || "N/A"}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button className="bg-primary hover:bg-amber-500 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200">
                  Edit Profile
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
