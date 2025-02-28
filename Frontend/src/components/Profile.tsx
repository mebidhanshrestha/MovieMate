import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Ensure axios is installed: npm install axios
import { X } from "lucide-react";

// Define interfaces for user data and form data
interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface EditProfileFormData {
  name: string;
  email: string;
}

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] =
    useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState<boolean>(false);
  const [editProfileFormData, setEditProfileFormData] =
    useState<EditProfileFormData>({
      name: "",
      email: "",
    });
  const [passwordFormData, setPasswordFormData] =
    useState<ChangePasswordFormData>({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
          `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("API Response:", response.data);

        setUser({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role || "user",
        });

        setEditProfileFormData({
          name: response.data.name,
          email: response.data.email,
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

  // Handle input changes for edit profile form
  const handleEditProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfileFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle input changes for change password form
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle edit profile submission
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMessage(null);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id");

      if (!token || !userId) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`,
        editProfileFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update user state with the updated data
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: editProfileFormData.name,
          email: editProfileFormData.email,
        };
      });

      // Update localStorage with new user data
      localStorage.setItem("userName", editProfileFormData.name);
      localStorage.setItem("userEmail", editProfileFormData.email);

      setUpdateMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Close modal after a short delay
      setTimeout(() => {
        setShowEditProfileModal(false);
        setUpdateMessage(null);
      }, 2000);
    } catch (err) {
      console.error("Error updating profile:", err);
      if (axios.isAxiosError(err)) {
        setUpdateMessage({
          type: "error",
          text: err.response?.data?.message || "Failed to update profile",
        });
      } else {
        setUpdateMessage({ type: "error", text: "An unknown error occurred" });
      }
    }
  };

  // Handle change password submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateMessage(null);

    // Validate passwords
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordUpdateMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id");

      if (!token || !userId) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}/password`,
        {
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPasswordUpdateMessage({
        type: "success",
        text: "Password changed successfully!",
      });

      // Reset form
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Close modal after a short delay
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordUpdateMessage(null);
      }, 2000);
    } catch (err) {
      console.error("Error changing password:", err);
      if (axios.isAxiosError(err)) {
        setPasswordUpdateMessage({
          type: "error",
          text: err.response?.data?.message || "Failed to change password",
        });
      } else {
        setPasswordUpdateMessage({
          type: "error",
          text: "An unknown error occurred",
        });
      }
    }
  };

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
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="bg-primary hover:bg-amber-500 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center bg-primary p-4">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="p-6">
              {updateMessage && (
                <div
                  className={`mb-4 p-3 rounded-md ${
                    updateMessage.type === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {updateMessage.text}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editProfileFormData.name}
                  onChange={handleEditProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editProfileFormData.email}
                  onChange={handleEditProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-amber-500 text-white font-medium py-2 px-4 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center bg-primary p-4">
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6">
              {passwordUpdateMessage && (
                <div
                  className={`mb-4 p-3 rounded-md ${
                    passwordUpdateMessage.type === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {passwordUpdateMessage.text}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
                {passwordFormData.newPassword !==
                  passwordFormData.confirmPassword &&
                  passwordFormData.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-amber-500 text-white font-medium py-2 px-4 rounded-md"
                  disabled={
                    passwordFormData.newPassword !==
                    passwordFormData.confirmPassword
                  }
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
