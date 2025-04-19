import { useState, useEffect } from "react";
import axios from "axios";
import { X, Plus, Trash, Edit, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import Popup from "../components/Popup"; // Adjust the import path as needed

interface Banner {
  _id: string;
  title: string;
  altText: string;
  image: string;
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
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

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    altText: "",
    active: true
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
  
  // For the token (you might want to use a context or state management for this)
  const token = localStorage.getItem("token");
  
  // Helper function to handle image paths consistently
  const getBannerImageUrl = (banner: Banner) => {
    // For uploaded images from the server
    const path = banner.image;
    
    // If path already includes /uploads, don't add the prefix again
    if (path.startsWith('/uploads/')) {
      return `http://localhost:3001${path}`;
    } 
    // If path is in new format (/banners/...)
    else if (path.startsWith('/banners/')) {
      return `http://localhost:3001/uploads${path}`;
    }
    // Fall back to a safe format
    else {
      const safePath = path.startsWith('/') ? path : `/${path}`;
      return `http://localhost:3001/uploads${safePath}`;
    }
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/api/banner");
      console.log("Fetched banners:", response.data);
      setBanners(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError("Failed to load banners");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      altText: "",
      active: true
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingBanner(null);
  };

  const openModal = (banner?: Banner) => {
    if (banner) {
      // Edit mode
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        altText: banner.altText,
        active: banner.active
      });
      // Use the helper function to generate the correct URL
      setPreviewUrl(getBannerImageUrl(banner));
      console.log("Preview URL set to:", getBannerImageUrl(banner));
    } else {
      // Add mode
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("altText", formData.altText);
      formDataToSend.append("active", formData.active.toString());
      
      // If editing, include existing order; if adding new, use the length of banners as default order
      if (editingBanner) {
        formDataToSend.append("order", editingBanner.order.toString());
      } else {
        // For new banners, put them at the end of the list
        formDataToSend.append("order", banners.length.toString());
      }
      
      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }
      
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      };
      
      if (editingBanner) {
        // Update existing banner
        await axios.put(
          `http://localhost:3001/api/banner/${editingBanner._id}`,
          formDataToSend,
          { headers }
        );
        
        showPopup({
          title: "Success",
          message: "Banner updated successfully!",
          primaryButton: {
            text: "OK",
            onClick: () => {
              closePopup();
              closeModal();
              fetchBanners();
            }
          }
        });
      } else {
        // Create new banner
        if (!selectedFile) {
          showPopup({
            title: "Missing Image",
            message: "Please select an image",
            primaryButton: {
              text: "OK",
              onClick: closePopup
            }
          });
          return;
        }
        
        await axios.post(
          "http://localhost:3001/api/banner",
          formDataToSend,
          { headers }
        );
        
        showPopup({
          title: "Success",
          message: "Banner added successfully!",
          primaryButton: {
            text: "OK",
            onClick: () => {
              closePopup();
              closeModal();
              fetchBanners();
            }
          }
        });
      }
    } catch (err) {
      console.error("Error saving banner:", err);
      setError("Failed to save banner");
      showPopup({
        title: "Error",
        message: "Failed to save banner. Please try again.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await axios.patch(
        `http://localhost:3001/api/banner/${banner._id}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchBanners();
    } catch (err) {
      console.error("Error toggling banner status:", err);
      setError("Failed to update banner status");
      showPopup({
        title: "Error",
        message: "Failed to update banner status. Please try again.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    }
  };

  const deleteBanner = async (bannerId: string) => {
    showPopup({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this banner?",
      primaryButton: {
        text: "Delete",
        onClick: async () => {
          closePopup();
          try {
            await axios.delete(`http://localhost:3001/api/banner/${bannerId}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            showPopup({
              title: "Success",
              message: "Banner deleted successfully!",
              primaryButton: {
                text: "OK",
                onClick: () => {
                  closePopup();
                  fetchBanners();
                }
              }
            });
          } catch (err) {
            console.error("Error deleting banner:", err);
            setError("Failed to delete banner");
            showPopup({
              title: "Error",
              message: "Failed to delete banner. Please try again.",
              primaryButton: {
                text: "OK",
                onClick: closePopup
              }
            });
          }
        }
      },
      secondaryButton: {
        text: "Cancel",
        onClick: closePopup
      }
    });
  };

  const reorderBanner = async (bannerId: string, direction: "up" | "down") => {
    // Find the banner and its index
    const index = banners.findIndex(b => b._id === bannerId);
    if (index === -1) return;
    
    // Can't move first item up or last item down
    if ((direction === "up" && index === 0) || 
        (direction === "down" && index === banners.length - 1)) {
      return;
    }
    
    // Find the adjacent banner based on direction
    const adjacentIndex = direction === "up" ? index - 1 : index + 1;
    const banner = banners[index];
    const adjacentBanner = banners[adjacentIndex];
    
    // Swap their orders
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      // Update current banner's order
      await axios.put(
        `http://localhost:3001/api/banner/${banner._id}`,
        { ...banner, order: adjacentBanner.order },
        { headers }
      );
      
      // Update adjacent banner's order
      await axios.put(
        `http://localhost:3001/api/banner/${adjacentBanner._id}`,
        { ...adjacentBanner, order: banner.order },
        { headers }
      );
      
      fetchBanners();
    } catch (err) {
      console.error("Error reordering banners:", err);
      setError("Failed to reorder banners");
      showPopup({
        title: "Error",
        message: "Failed to reorder banners. Please try again.",
        primaryButton: {
          text: "OK",
          onClick: closePopup
        }
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banner Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Banner
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <p className="text-gray-500">No banners found</p>
          <button
            onClick={() => openModal()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Add Your First Banner
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Alt Text</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <img
                      src={getBannerImageUrl(banner)}
                      alt={banner.altText}
                      className="w-20 h-12 object-cover rounded"
                      onError={(e) => {
                        console.error("Failed to load banner image:", banner.image);
                        (e.target as HTMLImageElement).src = "https://placehold.co/80x48?text=Image+Error";
                      }}
                    />
                  </td>
                  <td className="p-3">{banner.title}</td>
                  <td className="p-3">{banner.altText}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        banner.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {banner.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => reorderBanner(banner._id, "up")}
                        className="p-1 text-gray-600 hover:text-gray-900"
                        title="Move Up"
                        disabled={banners.indexOf(banner) === 0}
                      >
                        <ArrowUp className={`w-4 h-4 ${banners.indexOf(banner) === 0 ? 'opacity-50' : ''}`} />
                      </button>
                      <button
                        onClick={() => reorderBanner(banner._id, "down")}
                        className="p-1 text-gray-600 hover:text-gray-900"
                        title="Move Down"
                        disabled={banners.indexOf(banner) === banners.length - 1}
                      >
                        <ArrowDown className={`w-4 h-4 ${banners.indexOf(banner) === banners.length - 1 ? 'opacity-50' : ''}`} />
                      </button>
                      <button
                        onClick={() => openModal(banner)}
                        className="p-1 text-yellow-600 hover:text-yellow-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBanner(banner._id)}
                        className="p-1 text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit Banner */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingBanner ? "Edit Banner" : "Add New Banner"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="altText" className="block text-sm font-medium text-gray-700 mb-1">
                      Alt Text (for accessibility)
                    </label>
                    <input
                      type="text"
                      id="altText"
                      name="altText"
                      value={formData.altText}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                      Active (visible on the homepage)
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Image {!editingBanner && "(Required)"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full p-2 border rounded-md"
                      required={!editingBanner}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 1200×400 pixels. Max file size: 5MB.
                    </p>
                  </div>
                  
                  {previewUrl && (
                    <div>
                      <p className="block text-sm font-medium text-gray-700 mb-1">Preview</p>
                      <img
                        src={previewUrl}
                        alt="Banner preview"
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          console.error("Failed to load preview image");
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x200?text=Preview+Error";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingBanner ? "Update Banner" : "Add Banner"}
                </button>
              </div>
            </form>
          </div>
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
}