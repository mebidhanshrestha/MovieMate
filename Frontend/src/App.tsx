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

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const userRole = localStorage.getItem("role");
  return userRole === role ? children : <Navigate to="/login" />;
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
          <Route path="/movies" element={<Movies />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="menu" element={<AdminMenu />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;