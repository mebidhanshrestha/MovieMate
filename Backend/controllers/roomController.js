import Room from "../models/Room.js";
import Movie from "../models/Movie.js";

// Function to generate seats
const generateSeats = (rows, cols) => {
  const seats = [];
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= cols; c++) {
      seats.push({ seat_number: `${rowLabels[r]}${c}`, status: "available" });
    }
  }
  return seats;
};

// Allocate a movie to a room with showtimes
export const allocateMovieToRoom = async (req, res) => {
  try {
    const { movie_id, room_id, schedule } = req.body;

    if (!movie_id || !room_id || !schedule || schedule.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const room = await Room.findById(room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const movie = await Movie.findById(movie_id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    for (const { date, time_slots } of schedule) {
      for (const { start_time, end_time } of time_slots) {
        // Check for overlapping showtimes
        const isOverlapping = room.showtimes.some(
          (show) =>
            show.date.toISOString() === new Date(date).toISOString() &&
            ((start_time >= show.start_time && start_time < show.end_time) ||
              (end_time > show.start_time && end_time <= show.end_time))
        );

        if (isOverlapping) {
          return res.status(400).json({
            message: `Showtime overlaps in the selected room on ${date}`,
          });
        }

        // Add showtime to the room
        const newShowtime = {
          movie_id,
          date: new Date(date),
          start_time,
          end_time,
          seats: generateSeats(5, 10),
        };

        room.showtimes.push(newShowtime);
      }
    }

    await room.save();
    res.status(201).json({ message: "Movie allocated successfully", room });
  } catch (error) {
    console.error("Error allocating movie:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all showtimes for a room
export const getRoomShowtimes = async (req, res) => {
  try {
    const { room_id } = req.params;
    const room = await Room.findById(room_id).populate("showtimes.movie_id");

    if (!room) return res.status(404).json({ message: "Room not found" });

    res.status(200).json({ showtimes: room.showtimes });
  } catch (error) {
    console.error("Error fetching showtimes:", error);
    res.status(500).json({ message: "Server error" });
  }
};
