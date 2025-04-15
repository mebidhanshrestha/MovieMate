import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MainLayout from "./components/MainLayout";
import DashboardLayout from "./components/DashboardLayout";
import AdminMenu from "./pages/AdminMenu";
import PrivateRoute, { PrivateRouteWrapper } from "./routes/PrivateRoutes";
import Movie from "./pages/AdminMovie";
import MovieAllocation from "./pages/MovieAllocation";
import Menu from "./pages/Menu";
import MovieList from "./pages/MovieList";
import ShowtimeSelection from "./pages/ShowtimeSelection";
import SeatSelection from "./pages/SeatSelection";
import MenuSelection from "./pages/MenuSelection";
import BookingConfirmation from "./pages/BookingConfirmation";
import Profile from "./components/Profile"; // Import from components directory
import History from "./pages/History"; // Import the History component
import AdminBookings from "./pages/AdminBookings"; // Import the AdminBookings component
import EsewaSuccess from "./pages/EsewaSuccess"; // Import the EsewaSuccess component
import EsewaFailure from "./pages/EsewaFailure"; // Import the EsewaFailure component
import AdminUserManagement from "./pages/AdminUserManagement"; // Import the AdminUserManagement component
import BannerManagement from "./pages/BannerManagement";
import NotificationCenter from "./pages/NotificationCenter"; // Import the new NotificationCenter page

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const userRole = localStorage.getItem("role");
  return userRole === role ? <>{children}</> : <Navigate to="/" />;
};

// Simple function to check if the user is logged in
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Normal user home */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MovieList />} />
          <Route path="/showtimes/:movieId" element={<ShowtimeSelection />} />
          <Route
            path="/seats/:showtimeId/:movieId/:roomId"
            element={<SeatSelection />}
          />
          <Route path="/menu" element={<MenuSelection />} />
          <Route path="/confirmation" element={<BookingConfirmation />} />

          {/* eSewa payment handling routes */}
          <Route path="/esewa-success" element={<EsewaSuccess />} />
          <Route path="/esewa-failure" element={<EsewaFailure />} />

          {/* Protected Profile route */}
          <Route
            path="/profile"
            element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />}
          />

          {/* Protected Settings route (currently using Profile) */}
          <Route
            path="/settings"
            element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />}
          />

          {/* Protected History route */}
          <Route
            path="/history"
            element={isAuthenticated() ? <History /> : <Navigate to="/login" />}
          />
          
          {/* New Notification Center route */}
          <Route
            path="/notifications"
            element={isAuthenticated() ? <NotificationCenter /> : <Navigate to="/login" />}
          />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="admin">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="menu"
              element={
                <ProtectedRoute role="admin">
                  <AdminMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="movie"
              element={
                <ProtectedRoute role="admin">
                  <Movie />
                </ProtectedRoute>
              }
            />
            <Route
              path="movie-allocate"
              element={
                <ProtectedRoute role="admin">
                  <MovieAllocation />
                </ProtectedRoute>
              }
            />
            {/* Add the new AdminBookings route */}
            <Route
              path="bookings"
              element={
                <ProtectedRoute role="admin">
                  <AdminBookings />
                </ProtectedRoute>
              }
            />
            {/* Add the new AdminUserManagement route */}
            <Route
              path="users"
              element={
                <ProtectedRoute role="admin">
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
            {/* Add the new AdminBanners route */}
            <Route
              path="manage-banner"
              element={
                <ProtectedRoute role="admin">
                  <BannerManagement />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;