const mongoose = require("mongoose");
const Room = require("./models/Room");

mongoose.connect("mongodb://localhost:27017/moviemate");

const createRooms = async () => {
  try {
    // Create Room A
    const roomA = new Room({
      name: "Room A",
      total_seats: 50, // Assuming Room A has more seats, adjust as needed
    });
    
    // Create Room B
    const roomB = new Room({
      name: "Room B",
      total_seats: 50,
    });

    // Save both rooms
    const savedRoomA = await roomA.save();
    const savedRoomB = await roomB.save();
    
    console.log("Room A created successfully:", savedRoomA);
    console.log("Room B created successfully:", savedRoomB);
    
    mongoose.disconnect();
  } catch (error) {
    console.error("Error creating rooms:", error);
    mongoose.disconnect();
  }
};

createRooms();