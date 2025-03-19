import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Original PrivateRoute component
const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    console.log("PrivateRoute - Token exists:", !!token);
  }, [token]);
  
  return token ? <Outlet /> : <Navigate to="/login" />;
};

// PrivateRouteWrapper component that accepts children
export const PrivateRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    console.log("PrivateRouteWrapper - Token exists:", !!token);
    console.log("PrivateRouteWrapper - Children:", children);
  }, [token, children]);
  
  // If token exists, render children, otherwise redirect to login
  if (!token) {
    console.log("PrivateRouteWrapper - Redirecting to login");
    return <Navigate to="/login" />;
  }
  
  console.log("PrivateRouteWrapper - Rendering children");
  return <>{children}</>;
};

export default PrivateRoute;