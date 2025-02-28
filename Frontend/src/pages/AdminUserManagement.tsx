import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { Search, Edit, Trash2, Key, Award, User, Mail, UserCog, X, Check, Save, ChevronRight } from 'lucide-react';

// Define TypeScript interfaces
interface User {
  _id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoyaltyPoints {
  points: number;
}

const AdminUserManagement: React.FC = () => {
  // Initialize all state variables with safe defaults
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user'
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints>({
    points: 0
  });
  const [loyaltyLoading, setLoyaltyLoading] = useState<boolean>(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [token, setToken] = useState<string>('');

  // Get token from localStorage when component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Safe fetch users function with extra error handling
  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (!token) {
        console.error("No token available");
        setError("Authentication token missing. Please log in again.");
        setUsers([]);
        return;
      }
      
      const response = await api.get(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
      
      console.log("API Response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        console.error("Unexpected API response format:", response.data);
        setError("Received unexpected data format from server");
        setUsers([]);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError('Failed to fetch users: ' + (err.response?.data?.message || err.message));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's loyalty points with safe error handling
  const fetchLoyaltyPoints = async (userId: string) => {
    if (!userId || !token) return;
    
    try {
      setLoyaltyLoading(true);
      
      const response = await api.get(`${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points/user/${userId}`);
      
      // Safely extract points from response
      const points = response.data?.data?.points || 0;
      setLoyaltyPoints({ points });
      setLoyaltyError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // If loyalty points don't exist for this user, set to 0
        setLoyaltyPoints({ points: 0 });
      } else {
        console.error("Error fetching loyalty points:", err);
        setLoyaltyError('Failed to fetch loyalty points: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoyaltyLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  // Select user for editing or viewing details
  const handleSelectUser = (user: User) => {
    if (!user || !user._id) return;
    
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user'
    });
    fetchLoyaltyPoints(user._id);
  };

  // Handle input changes for user form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for loyalty points
  const handleLoyaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setLoyaltyPoints({ points: value });
  };

  // Update user with safe error handling
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedUser._id || !token) return;
    
    try {
      setLoading(true);
      
      await api.put(`${import.meta.env.VITE_API_BASE_URL}/api/users/${selectedUser._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUsers();
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError('Failed to update user: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete user with safe error handling
  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser._id || !token) return;
    
    try {
      setLoading(true);
      
      await api.delete(`${import.meta.env.VITE_API_BASE_URL}/api/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUsers();
      setSelectedUser(null);
      setShowDeleteModal(false);
      setError(null);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError('Failed to delete user: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };


  // Update loyalty points with safe error handling
  const handleUpdateLoyaltyPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedUser._id || !token) return;
    
    try {
      setLoyaltyLoading(true);
      
      // Check if loyalty points exist for this user
      try {
        await api.get(`${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points/user/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If found, update the existing points
        await api.put(`${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points/user/${selectedUser._id}`, {
          points: loyaltyPoints.points
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err: any) {
        // If not found (404), create new loyalty points
        if (err.response?.status === 404) {
          await api.post(`${import.meta.env.VITE_API_BASE_URL}/api/loyalty-points`, {
            user_id: selectedUser._id,
            points: loyaltyPoints.points
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          throw err;
        }
      }
      
      setShowLoyaltyModal(false);
      setLoyaltyError(null);
    } catch (err: any) {
      console.error("Error updating loyalty points:", err);
      setLoyaltyError('Failed to update loyalty points: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoyaltyLoading(false);
    }
  };

  // Safely filter users based on search term
  const getFilteredUsers = () => {
    if (!Array.isArray(users)) {
      console.error("users is not an array:", users);
      return [];
    }
    
    return users.filter(user => {
      if (!user) return false;
      
      const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      
      return nameMatch || emailMatch;
    });
  };

  // Get filtered users safely
  const filteredUsers = getFilteredUsers();

  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto p-5 font-sans">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-300 p-6 text-white">
          <h1 className="text-3xl font-bold flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> 
            Admin User Management
          </h1>
          <p className="mt-2 opacity-90">Manage user accounts, roles, and loyalty points</p>
        </div>
        
        {/* Search Bar */}
        <div className="p-5 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="mx-5 my-4 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-md flex items-start">
            <div className="mr-3 mt-0.5">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>{error}</div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row">
          {/* Users List */}
          <div className="md:w-80 border-r border-gray-200">
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-500" /> Users Directory
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredUsers.map(user => (
                  <div 
                    key={user._id} 
                    className={`p-4 cursor-pointer transition-all hover:bg-blue-50 flex items-center ${
                      selectedUser?._id === user._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3 ${
                      user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.name || 'Unnamed User'}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email || 'No email'}</div>
                    </div>
                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                  </div>
                ))}
                
                {!loading && filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <div className="mb-3">
                      <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg">No users found</p>
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* User Details and Edit Form */}
          <div className="flex-1 p-6">
            {selectedUser ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 mb-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0 flex items-center">
                    {isEditing ? (
                      <>
                        <Edit className="mr-2 h-5 w-5 text-blue-500" /> 
                        Edit User
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-5 w-5 text-blue-500" /> 
                        User Profile
                      </>
                    )}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                    {!isEditing ? (
                      <>
                        <button 
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="mr-1 h-4 w-4" /> Edit
                        </button>
                        <button 
                          className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-colors shadow-sm"
                          onClick={() => setShowLoyaltyModal(true)}
                        >
                          <Award className="mr-1 h-4 w-4" /> Points
                        </button>
                        <button 
                          className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors shadow-sm"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </button>
                      </>
                    ) : (
                      <button 
                        className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors shadow-sm"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: selectedUser.name || '',
                            email: selectedUser.email || '',
                            role: selectedUser.role || 'user'
                          });
                        }}
                      >
                        <X className="mr-1 h-4 w-4" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleUpdateUser} className="space-y-5 max-w-2xl">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block font-medium text-gray-700 flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-500" /> Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="block font-medium text-gray-700 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-500" /> Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="role" className="block font-medium text-gray-700 flex items-center">
                        <UserCog className="mr-2 h-4 w-4 text-gray-500" /> Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-sm"
                    >
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center mb-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-medium mr-6 ${
                        selectedUser.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        {getInitials(selectedUser.name)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name || 'Unnamed User'}</h3>
                        <p className="text-gray-500">{selectedUser.email || 'No email'}</p>
                        <span className={`mt-2 inline-block text-xs font-medium px-3 py-1 rounded-full ${
                          selectedUser.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedUser.role || 'user'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-4">Account Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-36 text-gray-500 flex items-center">
                            <User className="mr-2 h-4 w-4" /> Name
                          </div>
                          <div className="text-gray-900 font-medium">{selectedUser.name || 'N/A'}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-36 text-gray-500 flex items-center">
                            <Mail className="mr-2 h-4 w-4" /> Email
                          </div>
                          <div className="text-gray-900 font-medium">{selectedUser.email || 'N/A'}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-36 text-gray-500 flex items-center">
                            <UserCog className="mr-2 h-4 w-4" /> Role
                          </div>
                          <div className="text-gray-900 font-medium">{selectedUser.role || 'user'}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-36 text-gray-500">ID</div>
                          <div className="text-gray-900 break-all text-sm">{selectedUser._id}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-5 border border-amber-200">
                      <h4 className="font-medium text-amber-800 mb-4 flex items-center">
                        <Award className="mr-2 h-5 w-5 text-amber-600" /> Loyalty Points
                      </h4>
                      <div className="flex items-center">
                        <div className="text-3xl font-bold text-amber-600">
                          {loyaltyLoading ? (
                            <div className="animate-pulse bg-amber-200 h-8 w-16 rounded"></div>
                          ) : (
                            loyaltyPoints.points
                          )}
                        </div>
                        <div className="ml-3 text-amber-700">
                          points
                        </div>
                        <button 
                          className="ml-auto inline-flex items-center px-3 py-1.5 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-colors shadow-sm"
                          onClick={() => setShowLoyaltyModal(true)}
                        >
                          <Edit className="mr-1 h-3 w-3" /> Edit Points
                        </button>
                      </div>
                      {loyaltyError && (
                        <div className="text-sm text-red-600 mt-1">{loyaltyError}</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-500">
                <User className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-lg font-medium">Select a user from the list</p>
                <p className="text-sm mt-1">User details will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-500 mb-4">
                <Trash2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="mb-4 text-center">
              Are you sure you want to delete user <span className="font-semibold">{selectedUser?.name}</span>?
            </p>
            <p className="mb-6 text-center text-gray-600 text-sm">This action cannot be undone.</p>
            
            <div className="flex justify-center gap-3">
              <button 
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                onClick={handleDeleteUser}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Loyalty Points Modal */}
        {showLoyaltyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 text-amber-600 mb-4">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Manage Loyalty Points
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  For user {selectedUser?.name}
                </p>
              </div>
              
              {loyaltyError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-md text-sm">
                  {loyaltyError}
                </div>
              )}
              
              <form onSubmit={handleUpdateLoyaltyPoints} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="points" className="block font-medium text-gray-700 text-sm">
                    Loyalty Points
                  </label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={loyaltyPoints.points}
                    onChange={handleLoyaltyChange}
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>
                
                <div className="flex justify-center gap-3 pt-2 mt-6">
                  <button 
                    type="button"
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                    onClick={() => setShowLoyaltyModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-colors inline-flex items-center"
                    disabled={loyaltyLoading}
                  >
                    {loyaltyLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1 h-4 w-4" /> Save Points
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default AdminUserManagement;