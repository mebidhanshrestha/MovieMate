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
import PrivateRoute from "./routes/PrivateRoutes";
import Movie from "./pages/AdminMovie";
import MovieAllocation from "./pages/MovieAllocation";
import Menu from "./pages/Menu";
import MovieList from "./pages/MovieList";
import ShowtimeSelection from "./pages/ShowtimeSelection";
import SeatSelection from "./pages/SeatSelection";
import MenuSelection from "./pages/MenuSelection";
import BookingConfirmation from "./pages/BookingConfirmation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const userRole = localStorage.getItem("role");
  return userRole === role ? children : <Navigate to="/" />;
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
          {/* <Route path="/menu" element={<Menu />} /> */}
          <Route path="/movies" element={<MovieList />} />
          <Route path="/showtimes/:movieId" element={<ShowtimeSelection />} />
          <Route
            path="/seats/:showtimeId/:movieId/:roomId"
            element={<SeatSelection />}
          />
          <Route path="/menu" element={<MenuSelection />} />
          <Route path="/confirmation" element={<BookingConfirmation />} />
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
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
