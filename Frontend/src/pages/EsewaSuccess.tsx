import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const EsewaSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const completeBooking = async () => {
      try {
        // Log all available data for debugging
        console.log('URL Search params:', location.search);
        console.log('Local storage pendingBooking:', localStorage.getItem('pendingBooking'));
        
        // Parse URL parameters
        const searchParams = new URLSearchParams(location.search);
        const oid = searchParams.get('oid');      // Order ID
        const amt = searchParams.get('amt');      // Amount
        const refId = searchParams.get('refId');  // Reference ID
        
        // For testing purposes, generate a mock refId if it's missing
        const referenceId = refId || `TEST_REF_${Date.now()}`;
        
        // Get pending booking from localStorage
        const pendingBookingData = localStorage.getItem('pendingBooking');
        if (!pendingBookingData) {
          console.error('No pending booking data found in localStorage');
          setError('Booking information not found. Please try again or contact support.');
          setLoading(false);
          return;
        }

        const pendingBooking = JSON.parse(pendingBookingData);
        setBookingDetails(pendingBooking);
        
        // Proceed with creating booking without verification for testing
        try {
          // Format booking data to match backend expectations
          const bookingData = {
            user_id: pendingBooking.user_id,
            movie_id: pendingBooking.movie_id,
            room_id: pendingBooking.room_id,
            date: pendingBooking.date,
            time_slot: pendingBooking.time_slot,
            seats: pendingBooking.seats,
            menu_items: pendingBooking.menu_items,
            payment_method: 'esewa',
            total_price: pendingBooking.total_price,
            transaction_id: pendingBooking.transaction_id,
            esewa_token: referenceId,
            status: 'confirmed'
          };
          
          console.log('Sending booking data to create booking:', bookingData);
          
          const bookingResponse = await axios.post('http://localhost:3001/api/booking-management//booking/movie-book', bookingData);
          
          console.log('Booking confirmed:', bookingResponse.data);
          
          // Clear the pending booking data
          localStorage.removeItem('pendingBooking');
          
          // Redirect to homepage with success message
          setTimeout(() => {
            navigate('/', {
              state: {
                bookingSuccess: true,
                message: 'Your booking has been successfully confirmed!'
              }
            });
          }, 1500);
        } catch (bookingError: any) {
          console.error('Error creating booking:', bookingError);
          console.error('Booking error details:', bookingError.response?.data);
          
          setError('There was an error creating your booking. Please contact support.');
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Error in EsewaSuccess:', error);
        console.error('Error details:', error.response?.data);
        setError('There was a problem completing your booking. Please contact support.');
        setLoading(false);
      }
    };

    completeBooking();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: "#FBC700" }}></div>
          <h2 className="text-xl font-bold mb-2">Processing Booking...</h2>
          <p className="text-gray-600">Please do not close this window</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Booking Error</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 text-center">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
        <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
        <p className="text-gray-700">Your booking is being processed...</p>
        <p className="text-gray-600 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default EsewaSuccess;