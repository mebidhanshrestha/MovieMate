import { useState } from "react";
import axios from "axios";

const AddMovie = () => {
  const [movie, setMovie] = useState({
    title: "",
    description: "",
    duration: "",
    start_date: "",
    end_date: "",
    status: "hosting",
    type: "current",
    image: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMovie((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMovie((prev) => ({ ...prev, image: e.target.files && e.target.files[0]}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", movie.title);
    formData.append("description", movie.description);
    formData.append("duration", movie.duration);
    formData.append("start_date", movie.start_date);
    formData.append("end_date", movie.end_date);
    formData.append("status", movie.status);
    formData.append("type", movie.type);
    if (movie.image) {
      formData.append("image", movie.image);
    }

    try {
      await axios.post("http://localhost:3001/api/movie/add", formData, { // Fixed API path
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Movie added successfully!");
      setMovie({
        title: "",
        description: "",
        duration: "",
        start_date: "",
        end_date: "",
        status: "hosting",
        type: "current",
        image: null,
      });
    } catch (error) {
      console.error("Error adding movie:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-5 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Add Movie</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title:</label>
          <input type="text" name="title" value={movie.title} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium">Description:</label>
          <textarea name="description" value={movie.description} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium">Duration (minutes):</label>
          <input type="number" name="duration" value={movie.duration} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block font-medium">Start Date:</label>
            <input type="date" name="start_date" value={movie.start_date} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">End Date:</label>
            <input type="date" name="end_date" value={movie.end_date} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
          <label className="block font-medium">Status:</label>
          <select name="status" value={movie.status} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="hosting">Hosting</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Type:</label>
          <select name="type" value={movie.type} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="current">Current</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Movie Image:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border p-2 rounded" />
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Movie</button>
      </form>
    </div>
  );
};

export default AddMovie;