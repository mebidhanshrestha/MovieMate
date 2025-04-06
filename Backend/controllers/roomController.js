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

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find(); // Fetch all rooms
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Add these functions at the end of your roomController file

// Update a showtime
export const updateShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const { room_id, date, start_time, end_time } = req.body;
    
    if (!room_id || !date || !start_time || !end_time) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    const room = await Room.findById(room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    // Find the showtime to update
    const showtimeIndex = room.showtimes.findIndex(st => st._id.toString() === showtimeId);
    
    if (showtimeIndex === -1) {
      return res.status(404).json({ message: "Showtime not found" });
    }
    
    const newDate = new Date(date);
    
    // Check for overlapping showtimes (excluding the one being updated)
    const isOverlapping = room.showtimes.some(
      (show, index) =>
        index !== showtimeIndex &&
        show.date.toISOString().split('T')[0] === newDate.toISOString().split('T')[0] &&
        ((start_time >= show.start_time && start_time < show.end_time) ||
          (end_time > show.start_time && end_time <= show.end_time) ||
          (start_time <= show.start_time && end_time >= show.end_time))
    );
    
    if (isOverlapping) {
      return res.status(400).json({
        message: `Showtime overlaps with another showtime on ${date}`,
      });
    }
    
    // Update the showtime
    room.showtimes[showtimeIndex].date = newDate;
    room.showtimes[showtimeIndex].start_time = start_time;
    room.showtimes[showtimeIndex].end_time = end_time;
    
    await room.save();
    
    res.status(200).json({ 
      message: "Showtime updated successfully", 
      showtime: room.showtimes[showtimeIndex] 
    });
    
  } catch (error) {
    console.error("Error updating showtime:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a showtime
export const deleteShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const { room_id } = req.body;
    
    if (!room_id) {
      return res.status(400).json({ message: "Room ID is required" });
    }
    
    const room = await Room.findById(room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    // Find and remove the showtime
    const initialLength = room.showtimes.length;
    room.showtimes = room.showtimes.filter(st => st._id.toString() !== showtimeId);
    
    if (room.showtimes.length === initialLength) {
      return res.status(404).json({ message: "Showtime not found" });
    }
    
    await room.save();
    
    res.status(200).json({ message: "Showtime deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting showtime:", error);
    res.status(500).json({ message: "Server error" });
  }
};