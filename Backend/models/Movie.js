const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  description: String,
  duration: Number, // in minutes
  start_date: Date,
  end_date: Date,
  status: { type: String, enum: ['hosting', 'expired'] },
  type: { type: String, enum: ['upcoming', 'current'] },
  image: String, // URL for movie image
  showtimes: [
    {
      date: Date,
      time_slots: [
        {
          start_time: String,
          end_time: String,
          room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }
        }
      ]
    }
  ]
});

movieSchema.pre('validate', function(next) {
  const existingTimeSlots = new Set();
  this.showtimes.forEach(showtime => {
    showtime.time_slots.forEach(slot => {
      const startTime = slot.start_time;
      const endTime = slot.end_time;
      existingTimeSlots.add(`${startTime}-${endTime}`);
    });
  });

  this.showtimes.forEach(showtime => {
    showtime.time_slots.forEach(slot => {
      const startTime = slot.start_time;
      const endTime = slot.end_time;
      
      for (let time of existingTimeSlots) {
        const [existingStart, existingEnd] = time.split('-');
        if ((startTime >= existingStart && startTime < existingEnd) || (endTime > existingStart && endTime <= existingEnd)) {
          return next(new Error(`Invalid time slot. Available time slots are: ${Array.from(existingTimeSlots).join(', ')}`));
        }
      }
    });
  });
  next();
});

module.exports = mongoose.model('Movie', movieSchema);