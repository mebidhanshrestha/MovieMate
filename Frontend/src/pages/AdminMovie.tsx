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
      setMovie((prev) => ({ ...prev, image:e.target.files && e.target.files[0] }));
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
      await axios.post("http://localhost:3001/api/movie/add", formData, {
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
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-primary">Add Movie</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Title:</label>
            <input
              type="text"
              name="title"
              value={movie.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Duration (minutes):</label>
            <input
              type="number"
              name="duration"
              value={movie.duration}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Start Date:</label>
            <input
              type="date"
              name="start_date"
              value={movie.start_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">End Date:</label>
            <input
              type="date"
              name="end_date"
              value={movie.end_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Status:</label>
            <select
              name="status"
              value={movie.status}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hosting">Hosting</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="w-1/2">
            <label className="block font-medium text-gray-700">Type:</label>
            <select
              name="type"
              value={movie.type}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="current">Current</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Description:</label>
          <textarea
            name="description"
            value={movie.description}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Movie Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary-100 transition-colors duration-200"
        >
          Add Movie
        </button>
      </form>
    </div>
  );
};

export default AddMovie;