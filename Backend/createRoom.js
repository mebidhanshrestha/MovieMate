import mongoose from "mongoose";
import Room from "./models/Room.js"; // Adjust path if needed

mongoose.connect("mongodb://localhost:27017/moviemate");

const createRoom = async () => {
  try {
    const room = new Room({
      name: "Room B",
      total_seats: 50,
    });

    const savedRoom = await room.save();
    console.log("Room created successfully:", savedRoom);
    mongoose.disconnect();
  } catch (error) {
    console.error("Error creating room:", error);
  }
};

createRoom();