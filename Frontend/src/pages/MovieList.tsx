import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

type Movie = {
  _id: string;
  title: string;
  image: string;
};

const MovieList = () => {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/movie")
      .then((response) => setMovies(response.data.movies))
      .catch((error) => console.error("Error fetching movies:", error));
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {movies.map((movie) => (
        <Link to={`/showtimes/${movie._id}`} key={movie._id}>
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <img
              src={`http://localhost:3001${movie.image}`}
              alt={movie.title}
              className="w-full h-auto aspect-[2/3] object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/api/placeholder/300/450";
              }}
            />

            <div className="p-4 text-center">
              <h2 className="text-xl font-bold">{movie.title}</h2>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default MovieList;
