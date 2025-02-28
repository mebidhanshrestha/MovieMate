import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const Watchlist: React.FC = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/watchlist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWatchlist(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setError("Failed to load watchlist. Please try again later.");
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (movieId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/watchlist/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWatchlist(prevWatchlist =>
        prevWatchlist.filter(movie => movie._id !== movieId)
      );
      toast.success("Removed from watchlist!");
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist. Please try again.");
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return (
    <div>
      {/* Render your watchlist component content here */}
    </div>
  );
};

export default Watchlist; 