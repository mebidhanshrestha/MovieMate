import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react';
import api from '../config/api';
import Popup from '../components/Popup'; // Adjust the import path as needed

// Define interfaces for our data types
interface MenuItem {
  _id: string;
  name: string;
  price: number;
  weight: number;
  calories: number;
  image: string;
}

interface NewMenuItem {
  name: string;
  price: string;
  weight: string;
  calories: string;
  image: File | null;
}

interface PopupConfig {
  isOpen: boolean;
  title: string;
  message: string;
  primaryButton: {
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
}

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewMenuItem>({
    name: '',
    price: '',
    weight: '',
    calories: '',
    image: null,
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    weight: '',
    calories: '',
    image: null as File | null,
  });
  
  // Popup state
  const [popup, setPopup] = useState<PopupConfig>({
    isOpen: false,
    title: "",
    message: "",
    primaryButton: {
      text: "OK",
      onClick: () => closePopup()
    }
  });
  
  // Helper function to show popup
  const showPopup = (config: Partial<PopupConfig>) => {
    setPopup({
      ...popup,
      isOpen: true,
      ...config
    });
  };
  
  // Helper function to close popup
  const closePopup = () => {
    setPopup({
      ...popup,
      isOpen: false
    });
  };

  // Helper function to get image URL
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_BASE_URL}${path}`;
  };

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await api.get<MenuItem[]>(`${import.meta.env.VITE_API_BASE_URL}/api/menu`);
        setMenuItems(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setError('Failed to load menu items');
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Handle file change for new item
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewItem({ ...newItem, image: e.target.files[0] });
    }
  };

  // Handle file change for edit form
  const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditFormData({ ...editFormData, image: e.target.files[0] });
    }
  };

  // Handle input change for new item
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  // Handle input change for edit form
  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Handle form submission for new item
  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('price', newItem.price);
      formData.append('weight', newItem.weight);
      formData.append('calories', newItem.calories);
      formData.append('image', newItem.image);

      const res = await api.post<MenuItem>(`${import.meta.env.VITE_API_BASE_URL}/api/menu/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMenuItems([...menuItems, res.data]);
      setNewItem({ name: '', price: '', weight: '', calories: '', image: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      showPopup({
        title: "Success",
        message: "Menu item added successfully!",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      setError('Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  // Start editing an item
  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      price: item.price.toString(),
      weight: item.weight.toString(),
      calories: item.calories.toString(),
      image: null,
    });
    setIsEditing(true);
    
    // Scroll to the edit form after state update
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingItem(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Submit edit form
  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', editFormData.name);
      formData.append('price', editFormData.price);
      formData.append('weight', editFormData.weight);
      formData.append('calories', editFormData.calories);
      
      if (editFormData.image) {
        formData.append('image', editFormData.image);
      }

      await api.put(`${import.meta.env.VITE_API_BASE_URL}/api/menu/update/${editingItem._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMenuItems(menuItems.map(item => 
        item._id === editingItem._id ? { ...item, ...formData } : item
      ));
      
      showPopup({
        title: "Success",
        message: "Menu item updated successfully!",
        primaryButton: {
          text: "OK",
          onClick: () => {
            closePopup();
            setIsEditing(false);
            setEditingItem(null);
            if (editFileInputRef.current) {
              editFileInputRef.current.value = '';
            }
          }
        }
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      setError('Failed to update menu item');
    } finally {
      setLoading(false);
    }
  };

  // Handle confirming deletion of menu item
  const confirmDelete = (id: string, name: string) => {
    showPopup({
      title: "Confirm Delete",
      message: `Are you sure you want to delete "${name}"?`,
      primaryButton: {
        text: "Delete",
        onClick: () => {
          handleDelete(id);
          closePopup();
        }
      },
      secondaryButton: {
        text: "Cancel",
        onClick: closePopup
      }
    });
  };

  // Handle deleting menu item
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`${import.meta.env.VITE_API_BASE_URL}/api/menu/delete/${id}`);
      setMenuItems(menuItems.filter(item => item._id !== id));
      showPopup({
        title: "Success",
        message: "Menu item deleted successfully!",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setError('Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-xl">
      <h2 className="text-3xl font-bold mb-8 text-primary relative">
        <span className="inline-block pb-2">Manage Menu</span>
      </h2>

      {/* Edit Menu Item Form (conditionally rendered) */}
      {isEditing && editingItem && (
        <div ref={editFormRef} className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg rounded-xl border-l-4 border-primary transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-primary">Edit Item: {editingItem.name}</h3>
            <button 
              onClick={handleCancelEdit}
              className="text-gray-600 hover:text-red-500 transition-colors duration-200 flex items-center"
            >
              <span className="mr-1">Cancel</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleUpdateItem} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Price:</label>
                <input
                  type="number"
                  name="price"
                  value={editFormData.price}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Weight (g):</label>
                <input
                  type="number"
                  name="weight"
                  value={editFormData.weight}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Calories (Kcal):</label>
                <input
                  type="number"
                  name="calories"
                  value={editFormData.calories}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                New Image (leave blank to keep current image):
              </label>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={handleEditFileChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
                {!editFormData.image && (
                  <div className="mt-2 md:mt-0">
                    <p className="text-sm text-gray-500 mb-1">Current image:</p>
                    <img 
                      src={getImageUrl(editingItem.image)} 
                      alt={editingItem.name} 
                      className="w-24 h-24 object-cover rounded-lg shadow-md border border-gray-200" 
                    />
                  </div>
                )}
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-all duration-200 shadow-md transform hover:scale-[1.01] flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Update Item
            </button>
          </form>
        </div>
      )}

      {/* Add New Menu Item */}
      <div className="mb-8 p-6 bg-white shadow-lg rounded-xl border-t-4 border-primary">
        <h3 className="text-xl font-bold mb-4 text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Item
        </h3>
        <form onSubmit={handleAddItem} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Name:</label>
              <input
                type="text"
                name="name"
                placeholder="Item name"
                value={newItem.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Price:</label>
              <input
                type="number"
                name="price"
                placeholder="Price in Rs."
                value={newItem.price}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Weight (g):</label>
              <input
                type="number"
                name="weight"
                placeholder="Weight in grams"
                value={newItem.weight}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Calories (Kcal):</label>
              <input
                type="number"
                name="calories"
                placeholder="Calories"
                value={newItem.calories}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Image:</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-all duration-200 shadow-md transform hover:scale-[1.01] flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Add Item
          </button>
        </form>
      </div>

      {/* List of Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item._id} className="bg-white shadow-lg hover:shadow-xl rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="relative">
              <img 
                src={getImageUrl(item.image)} 
                alt={item.name} 
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-0 right-0 m-2 px-2 py-1 bg-primary rounded-lg text-white text-sm font-bold">
                Rs. {item.price}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2 text-gray-800">{item.name}</h3>
              <div className="flex justify-between text-gray-600 mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  {item.weight}g
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                  {item.calories} Kcal
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleStartEdit(item)} 
                  className="flex-1 bg-primary text-white py-2 px-3 rounded-lg hover:bg-primary-100 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit
                </button>
                <button 
                  onClick={() => confirmDelete(item._id, item.name)} 
                  className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {menuItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No menu items yet</h3>
          <p className="text-gray-500">Add your first menu item using the form above</p>
        </div>
      )}
      
      {/* Popup Component */}
      <Popup 
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        primaryButton={popup.primaryButton}
        secondaryButton={popup.secondaryButton}
      />
    </div>
  );
};

export default AdminMenu;