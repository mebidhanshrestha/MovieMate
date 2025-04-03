import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

type Showtime = {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
};

type Room = {
  name: string;
  showtimes: Showtime[];
  id: string;
};

const ShowtimeSelection = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for active tabs
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:3001/api/movie/${movieId}/showtimess`)
      .then((response) => {
        const roomsData = response.data.rooms.map((room: any) => ({
          ...room,
          id: room._id,
        }));
        setRooms(roomsData);
        
        // Set default active tabs
        if (roomsData.length > 0) {
          setActiveRoom(roomsData[0].id);
          
          // Get unique dates from all showtimes
          const allDates = getAllDates(roomsData);
          if (allDates.length > 0) {
            setActiveDate(allDates[0]);
          }
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching showtimes:", error);
        setError("Unable to load showtimes. Please try again later.");
        setLoading(false);
      });
  }, [movieId]);

  // Function to get all unique dates across all rooms
  const getAllDates = (rooms: Room[]): string[] => {
    const uniqueDates = new Set<string>();
    
    rooms.forEach(room => {
      room.showtimes.forEach(showtime => {
        // Store date without time part for comparison
        const datePart = new Date(showtime.date).toISOString().split('T')[0];
        uniqueDates.add(datePart);
      });
    });
    
    return Array.from(uniqueDates).sort();
  };

  // Function to format date in a more readable way
  const formatDate = (dateString: string, format: 'full' | 'short' = 'full') => {
    const date = new Date(dateString);
    
    if (format === 'short') {
      return new Intl.DateTimeFormat('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    }
    
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Function to convert 24-hour time to 12-hour format with AM/PM
  const formatTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return time24; // Return original if parsing failed
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Function to filter showtimes by active date
  const getFilteredShowtimes = () => {
    if (!activeRoom || !activeDate) return [];
    
    const room = rooms.find(r => r.id === activeRoom);
    if (!room) return [];
    
    return room.showtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.date).toISOString().split('T')[0];
      return showtimeDate === activeDate;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const uniqueDates = getAllDates(rooms);
  const filteredShowtimes = getFilteredShowtimes();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg border my-3">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Select Your Showtime</h2>
      
      {rooms.length === 0 ? (
        <p className="text-center text-gray-600">No showtimes available for this movie.</p>
      ) : (
        <>
          {/* Room Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Rooms">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeRoom === room.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {room.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Date Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex space-x-6 py-2" aria-label="Dates">
                {uniqueDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setActiveDate(date)}
                    className={`py-2 px-3 rounded-md text-sm font-medium ${
                      activeDate === date
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    {formatDate(date, 'short')}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Active Date Header */}
          {activeDate && (
            <h3 className="text-xl font-medium text-gray-700 mb-4">
              {formatDate(activeDate)}
            </h3>
          )}

          {/* Showtimes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredShowtimes.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center py-8">
                No showtimes available for this selection.
              </p>
            ) : (
              filteredShowtimes.map((showtime) => (
                <Link
                  key={showtime._id}
                  to={`/seats/${showtime._id}/${movieId}/${activeRoom}?date=${encodeURIComponent(showtime.date)}`}
                  className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition transform hover:-translate-y-1"
                >
                  <div className="p-4 flex justify-between items-center">
                    <div className="text-gray-700">
                      <span className="font-semibold">{formatTo12Hour(showtime.start_time)}</span>
                      <span className="mx-2 text-gray-400">—</span>
                      <span className="text-gray-500">{formatTo12Hour(showtime.end_time)}</span>
                    </div>
                    <div className="text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ShowtimeSelection;