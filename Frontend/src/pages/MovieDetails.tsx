import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const MovieDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/movie/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMovie(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setError("Failed to load movie details. Please try again later.");
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/watchlist/add`,
        { movieId: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAddedToWatchlist(true);
      toast.success("Added to watchlist!");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist. Please try again.");
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [id, navigate]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default MovieDetails; 