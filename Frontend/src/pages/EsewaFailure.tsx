import React from 'react';
import { useNavigate } from 'react-router-dom';

const EsewaFailure: React.FC = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Navigate back to the booking confirmation page
    navigate(-1);
  };

  const handleCancel = () => {
    // Clear any pending booking data
    localStorage.removeItem('pendingBooking');
    // Navigate to the home page
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden" style={{borderTop: "8px solid #e53e3e"}}>
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Payment Failed</h2>
          
          <div className="mb-6 flex justify-center">
            <div className="rounded-full p-3 bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Your eSewa payment was not successful. The transaction has been cancelled.
          </p>
          
          <div className="flex flex-col sm:flex-row sm:justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={handleTryAgain}
            >
              Try Again
            </button>
            
            <button
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={handleCancel}
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsewaFailure;