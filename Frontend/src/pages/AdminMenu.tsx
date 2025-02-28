import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

// Define interfaces for our data types
interface MenuItem {
  _id: string;
  name: string;
  price: number;
  weight: number;
  calories:number;
  image: string;
}

interface NewMenuItem {
  name: string;
  price: string;
  weight: string;
  calories:string;
  image: File | null;
}

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<NewMenuItem>({
    name: '',
    price: '',
    weight: '',
    calories: '',
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
    
    if (!newItem.name || !newItem.price || !newItem.weight || !newItem.calories || !newItem.image) {
      alert('Please fill all fields and upload an image');
      return;
    }

    const formData = new FormData();
    formData.append('name', newItem.name);
    formData.append('price', newItem.price);
    formData.append('weight', newItem.weight);
    formData.append('calories', newItem.calories);
    formData.append('image', newItem.image);

    try {
      const res = await axios.post<MenuItem>('http://localhost:3001/api/menu/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMenuItems([...menuItems, res.data]);
      setNewItem({ name: '', price: '', weight:'',calories:'', image: null }); // Reset form
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
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-primary">Manage Menu</h2>

      {/* Add New Menu Item */}
      <div className="mb-6 p-6 bg-gray-100 shadow rounded-lg">
        <h3 className="text-lg font-bold mb-4">Add New Item</h3>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700">Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={newItem.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Price:</label>
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={newItem.price}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Weight:</label>
            <input
              type="number"
              name="weight"
              placeholder="Weight"
              value={newItem.weight}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Calories:</label>
            <input
              type="number"
              name="calories"
              placeholder="Calories"
              value={newItem.calories}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Image:</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-colors duration-200">
            Add Item
          </button>
        </form>
      </div>

      {/* List of Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item._id} className="bg-white shadow-md p-4 rounded-lg">
            <img src={`http://localhost:3001${item.image}`} alt={item.name} className="w-full h-32 object-cover rounded mb-4" />
            <h3 className="text-lg font-bold mb-2">{item.name}</h3>
            <div className="mb-3 [&_p]:text-base [&_p]:font-normal">
                  <p>{item.weight}g</p>
                  <p>{item.calories}Kcal</p>
                </div>
            <p className="text-green-600 font-bold mb-4">Rs. {item.price}</p>
            <button onClick={() => handleDelete(item._id)} className="w-full bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-200">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMenu;