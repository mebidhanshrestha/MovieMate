const Room = require("../models/Room");
const Movie = require("../models/Movie");

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
const allocateMovieToRoom = async (req, res) => {
  try {
    const { movie_id, room_id, schedule } = req.body;

    if (!movie_id || !room_id || !schedule || schedule.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide all required fields: movie ID, room ID, and schedule" 
      });
    }

    const room = await Room.findById(room_id);
    if (!room) return res.status(404).json({ 
      success: false,
      message: "Room not found. Please check the room ID and try again." 
    });

    const movie = await Movie.findById(movie_id);
    if (!movie) return res.status(404).json({ 
      success: false,
      message: "Movie not found. Please check the movie ID and try again." 
    });

    // Convert movie dates to Date objects for comparison
    const movieStartDate = new Date(movie.start_date);
    const movieEndDate = new Date(movie.end_date);

    // Helper function to check if a date is within the movie's date range
    const isDateWithinMovieRange = (date) => {
      const scheduleDate = new Date(date);
      // Set time to start of day for proper date comparison
      scheduleDate.setHours(0, 0, 0, 0);
      const startDate = new Date(movieStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(movieEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      return scheduleDate >= startDate && scheduleDate <= endDate;
    };

    // Check all showtimes for date validity
    for (const { date, time_slots } of schedule) {
      if (!isDateWithinMovieRange(date)) {
        return res.status(400).json({
          success: false,
          message: `Cannot allocate movie: Date ${date} is outside the movie's screening period (${movieStartDate.toISOString().split('T')[0]} to ${movieEndDate.toISOString().split('T')[0]}).`
        });
      }
    }

    // Helper function to check if two time ranges overlap
    const isTimeOverlapping = (start1, end1, start2, end2) => {
      // Convert time strings to minutes for easier comparison
      const toMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const start1Minutes = toMinutes(start1);
      const end1Minutes = toMinutes(end1);
      const start2Minutes = toMinutes(start2);
      const end2Minutes = toMinutes(end2);

      // Handle cases where showtime crosses midnight
      const isCrossingMidnight = (start, end) => end < start;
      
      // If either showtime crosses midnight, we need special handling
      if (isCrossingMidnight(start1, end1) || isCrossingMidnight(start2, end2)) {
        // For showtimes crossing midnight, we'll split them into two parts
        // and check each part separately
        
        // First showtime parts
        const firstShowParts = isCrossingMidnight(start1, end1) 
          ? [
              { start: start1Minutes, end: 24 * 60 }, // First part: start to midnight
              { start: 0, end: end1Minutes }         // Second part: midnight to end
            ]
          : [{ start: start1Minutes, end: end1Minutes }];

        // Second showtime parts
        const secondShowParts = isCrossingMidnight(start2, end2)
          ? [
              { start: start2Minutes, end: 24 * 60 }, // First part: start to midnight
              { start: 0, end: end2Minutes }         // Second part: midnight to end
            ]
          : [{ start: start2Minutes, end: end2Minutes }];

        // Check for overlap between any parts
        for (const part1 of firstShowParts) {
          for (const part2 of secondShowParts) {
            if (
              (part1.start >= part2.start && part1.start < part2.end) || // part1 starts during part2
              (part1.end > part2.start && part1.end <= part2.end) || // part1 ends during part2
              (part1.start <= part2.start && part1.end >= part2.end) // part1 completely encompasses part2
            ) {
              return true;
            }
          }
        }
        return false;
      }

      // For normal showtimes (not crossing midnight), use regular comparison
      return (
        (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) || // New movie starts during existing movie
        (end1Minutes > start2Minutes && end1Minutes <= end2Minutes) || // New movie ends during existing movie
        (start1Minutes <= start2Minutes && end1Minutes >= end2Minutes) // New movie completely encompasses existing movie
      );
    };

    // Check all showtimes for overlaps
    for (const { date, time_slots } of schedule) {
      const scheduleDate = new Date(date);
      
      for (const { start_time, end_time } of time_slots) {
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
          return res.status(400).json({
            success: false,
            message: "Invalid time format. Please use 24-hour format (HH:MM) for both start and end times."
          });
        }

        // Validate that end time is after start time (unless it crosses midnight)
        const startMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
        const endMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
        const isCrossingMidnight = endMinutes < startMinutes;
        
        if (!isCrossingMidnight && endMinutes <= startMinutes) {
          return res.status(400).json({
            success: false,
            message: "Invalid time slot: End time must be after start time (unless the showtime crosses midnight)."
          });
        }

        // Check for overlapping showtimes
        const isOverlapping = room.showtimes.some(
          (show) => {
            const showDate = new Date(show.date);
            // Check if dates match (ignoring time)
            const sameDate = 
              showDate.getFullYear() === scheduleDate.getFullYear() &&
              showDate.getMonth() === scheduleDate.getMonth() &&
              showDate.getDate() === scheduleDate.getDate();

            if (!sameDate) return false;

            // Check if times overlap
            return isTimeOverlapping(
              start_time,
              end_time,
              show.start_time,
              show.end_time
            );
          }
        );

        if (isOverlapping) {
          // Find the conflicting showtime for better error message
          const conflictingShowtime = room.showtimes.find(show => {
            const showDate = new Date(show.date);
            const sameDate = 
              showDate.getFullYear() === scheduleDate.getFullYear() &&
              showDate.getMonth() === scheduleDate.getMonth() &&
              showDate.getDate() === scheduleDate.getDate();
            
            return sameDate && isTimeOverlapping(
              start_time,
              end_time,
              show.start_time,
              show.end_time
            );
          });

          return res.status(400).json({
            success: false,
            message: `Time slot conflict: Cannot schedule movie from ${start_time} to ${end_time} on ${date} because it overlaps with an existing showtime (${conflictingShowtime.start_time} - ${conflictingShowtime.end_time}). Please choose a different time slot.`
          });
        }

        // Add showtime to the room
        const newShowtime = {
          movie_id,
          date: scheduleDate,
          start_time,
          end_time,
          seats: generateSeats(5, 10),
        };

        room.showtimes.push(newShowtime);
      }
    }

    await room.save();
    res.status(201).json({ 
      success: true,
      message: "Movie allocated successfully", 
      room 
    });
  } catch (error) {
    console.error("Error allocating movie:", error);
    res.status(500).json({ 
      success: false,
      message: "An error occurred while allocating the movie. Please try again later." 
    });
  }
};

// Get all showtimes for a room
const getRoomShowtimes = async (req, res) => {
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

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find(); // Fetch all rooms
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a showtime
const updateShowtime = async (req, res) => {
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

    // Get the movie to check its date range
    const movie = await Movie.findById(room.showtimes[showtimeIndex].movie_id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Convert movie dates to Date objects for comparison
    const movieStartDate = new Date(movie.start_date);
    const movieEndDate = new Date(movie.end_date);
    const newDate = new Date(date);

    // Set times to midnight for proper date comparison
    newDate.setHours(0, 0, 0, 0);
    const startDate = new Date(movieStartDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(movieEndDate);
    endDate.setHours(0, 0, 0, 0);

    // Check if the new date is within the movie's screening period
    if (newDate < startDate || newDate > endDate) {
      return res.status(400).json({
        success: false,
        message: `Cannot update showtime: Date ${date} is outside the movie's screening period (${movieStartDate.toISOString().split('T')[0]} to ${movieEndDate.toISOString().split('T')[0]}).`
      });
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Please use 24-hour format (HH:MM) for both start and end times."
      });
    }

    // Validate that end time is after start time (unless it crosses midnight)
    const startMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
    const endMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
    const isCrossingMidnight = endMinutes < startMinutes;
    
    if (!isCrossingMidnight && endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot: End time must be after start time (unless the showtime crosses midnight)."
      });
    }
    
    // Helper function to check if two time ranges overlap
    const isTimeOverlapping = (start1, end1, start2, end2) => {
      // Convert time strings to minutes for easier comparison
      const toMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const start1Minutes = toMinutes(start1);
      const end1Minutes = toMinutes(end1);
      const start2Minutes = toMinutes(start2);
      const end2Minutes = toMinutes(end2);

      // Handle cases where showtime crosses midnight
      const isCrossingMidnight = (start, end) => end < start;
      
      // If either showtime crosses midnight, we need special handling
      if (isCrossingMidnight(start1, end1) || isCrossingMidnight(start2, end2)) {
        // For showtimes crossing midnight, we'll split them into two parts
        // and check each part separately
        
        // First showtime parts
        const firstShowParts = isCrossingMidnight(start1, end1) 
          ? [
              { start: start1Minutes, end: 24 * 60 }, // First part: start to midnight
              { start: 0, end: end1Minutes }         // Second part: midnight to end
            ]
          : [{ start: start1Minutes, end: end1Minutes }];

        // Second showtime parts
        const secondShowParts = isCrossingMidnight(start2, end2)
          ? [
              { start: start2Minutes, end: 24 * 60 }, // First part: start to midnight
              { start: 0, end: end2Minutes }         // Second part: midnight to end
            ]
          : [{ start: start2Minutes, end: end2Minutes }];

        // Check for overlap between any parts
        for (const part1 of firstShowParts) {
          for (const part2 of secondShowParts) {
            if (
              (part1.start >= part2.start && part1.start < part2.end) || // part1 starts during part2
              (part1.end > part2.start && part1.end <= part2.end) || // part1 ends during part2
              (part1.start <= part2.start && part1.end >= part2.end) // part1 completely encompasses part2
            ) {
              return true;
            }
          }
        }
        return false;
      }

      // For normal showtimes (not crossing midnight), use regular comparison
      return (
        (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) || // New movie starts during existing movie
        (end1Minutes > start2Minutes && end1Minutes <= end2Minutes) || // New movie ends during existing movie
        (start1Minutes <= start2Minutes && end1Minutes >= end2Minutes) // New movie completely encompasses existing movie
      );
    };
    
    // Check for overlapping showtimes (excluding the one being updated)
    const isOverlapping = room.showtimes.some(
      (show, index) =>
        index !== showtimeIndex &&
        show.date.toISOString().split('T')[0] === newDate.toISOString().split('T')[0] &&
        isTimeOverlapping(start_time, end_time, show.start_time, show.end_time)
    );
    
    if (isOverlapping) {
      // Find the conflicting showtime for better error message
      const conflictingShowtime = room.showtimes.find((show, index) => 
        index !== showtimeIndex &&
        show.date.toISOString().split('T')[0] === newDate.toISOString().split('T')[0] &&
        isTimeOverlapping(start_time, end_time, show.start_time, show.end_time)
      );

      return res.status(400).json({
        success: false,
        message: `Time slot conflict: Cannot update showtime to ${start_time}-${end_time} on ${date} because it overlaps with an existing showtime (${conflictingShowtime.start_time} - ${conflictingShowtime.end_time}). Please choose a different time slot.`
      });
    }
    
    // Update the showtime
    room.showtimes[showtimeIndex].date = newDate;
    room.showtimes[showtimeIndex].start_time = start_time;
    room.showtimes[showtimeIndex].end_time = end_time;
    
    await room.save();
    
    res.status(200).json({ 
      success: true,
      message: "Showtime updated successfully", 
      showtime: room.showtimes[showtimeIndex] 
    });
    
  } catch (error) {
    console.error("Error updating showtime:", error);
    res.status(500).json({ 
      success: false,
      message: "An error occurred while updating the showtime. Please try again later." 
    });
  }
};

// Delete a showtime
const deleteShowtime = async (req, res) => {
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

// Get a room by ID
const getRoomById = async (req, res) => {
  try {
    const { room_id } = req.body; // Get room_id from request body instead of URL params
    
    console.log("Fetching room with ID from body:", room_id);
    
    if (!room_id) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required in request body"
      });
    }
    
    // Find the room by ID
    const room = await Room.findById(room_id);
    
    // If room not found, return 404
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: "Room not found" 
      });
    }
    
    // Return the room data
    res.status(200).json({ 
      success: true, 
      room
    });
  } catch (error) {
    console.error("Error fetching room by ID:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

module.exports = {
  allocateMovieToRoom,
  getRoomShowtimes,
  getRooms,
  updateShowtime,
  deleteShowtime,
  getRoomById
};