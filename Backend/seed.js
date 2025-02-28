const mongoose = require('mongoose');
const Room = require('./models/Room');

mongoose.connect('mongodb://localhost:27017/moviemate', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const generateSeats = (rows, cols) => {
  const seats = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= cols; c++) {
      seats.push({ seat_number: `${rowLabels[r]}${c}`, status: 'available' });
    }
  }
  return seats;
};

const addShowtimeToRoom = async (roomId, movieId, startTime, endTime, date) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) return console.log('Room not found');

    // Check if showtime overlaps with existing ones
    const isOverlapping = room.showtimes.some((show) => 
      show.date.toISOString() === new Date(date).toISOString() &&
      ((startTime >= show.start_time && startTime < show.end_time) || 
       (endTime > show.start_time && endTime <= show.end_time))
    );

    if (isOverlapping) {
      return console.log('Error: Showtime overlaps with another screening in the same room.');
    }

    // Create new showtime with separate seats
    const newShowtime = {
      movie_id: movieId,
      start_time: startTime,
      end_time: endTime,
      date: new Date(date),
      seats: generateSeats(5, 10) // 5 rows, 10 columns
    };

    room.showtimes.push(newShowtime);
    await room.save();
    console.log('Showtime added successfully!');
  } catch (error) {
    console.error('Error adding showtime:', error);
  }
};

addShowtimeToRoom('65abc123456', '65def789012', '08:00 AM', '11:00 AM', '2024-02-29');
addShowtimeToRoom('65abc123456', '65def789012', '12:00 PM', '03:00 PM', '2024-02-29');