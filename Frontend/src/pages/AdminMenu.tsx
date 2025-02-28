import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

// Define interfaces for our data types
interface MenuItem {
  _id: string;
  name: string;
  price: number;
  image: string;
}

interface NewMenuItem {
  name: string;
  price: string;
  image: File | null;
}

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<NewMenuItem>({
    name: '',
    price: '',
    image: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios.get<MenuItem[]>('http://localhost:3001/api/menu')
      .then(res => setMenuItems(res.data))
      .catch(err => console.error(err));
  }, []);

  // Handle file change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewItem({ ...newItem, image: e.target.files[0] });
    }
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newItem.name || !newItem.price || !newItem.image) {
      alert('Please fill all fields and upload an image');
      return;
    }

    const formData = new FormData();
    formData.append('name', newItem.name);
    formData.append('price', newItem.price);
    formData.append('image', newItem.image);

    try {
      const res = await axios.post<MenuItem>('http://localhost:3001/api/menu/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMenuItems([...menuItems, res.data]);
      setNewItem({ name: '', price: '', image: null }); // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Handle deleting menu item
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/menu/delete/${id}`);
      setMenuItems(menuItems.filter(item => item._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Menu</h2>

      {/* Add New Menu Item */}
      <div className="mb-6 p-4 bg-white shadow rounded">
        <h3 className="text-lg font-bold mb-2">Add New Item</h3>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={newItem.name}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={newItem.price}
          onChange={handleInputChange}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="w-full p-2 border rounded mb-2"
        />
        <button onClick={handleAddItem} className="bg-green-500 text-white px-4 py-2 rounded">
          Add Item
        </button>
      </div>

      {/* List of Menu Items */}
      <div className="grid grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <div key={item._id} className="bg-white shadow-md p-4 rounded">
            <img src={`http://localhost:3001${item.image}`} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />
            <h3 className="text-lg font-bold">{item.name}</h3>
            <p className="text-green-600 font-bold">Rs. {item.price}</p>

            {/* Delete Button */}
            <button onClick={() => handleDelete(item._id)} className="mt-2 bg-red-500 text-white px-3 py-1 rounded ml-2">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMenu;