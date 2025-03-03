import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const DashboardLayout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-5 sticky top-0 h-screen">
        <h2 className="text-xl font-bold mb-6 text-primary">Admin Dashboard</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <Link
                to="/dashboard"
                className={`block p-2 rounded transition-colors duration-200 ${
                  isActive("/dashboard") ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link
                to="/dashboard/menu"
                className={`block p-2 rounded transition-colors duration-200 ${
                  isActive("/dashboard/menu") ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                Manage Menu
              </Link>
            </li>
            <li className="mb-2">
              <Link
                to="/dashboard/movie"
                className={`block p-2 rounded transition-colors duration-200 ${
                  isActive("/dashboard/movie") ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                Movie
              </Link>
            </li>
            <li className="mb-2">
              <Link
                to="/dashboard/movie-allocate"
                className={`block p-2 rounded transition-colors duration-200 ${
                  isActive("/dashboard/movie-allocate") ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                Movie Allocate
              </Link>
            </li>
            <li className="mt-6">
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 py-2 rounded hover:bg-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        <Outlet /> {/* This will render child components like AdminMenu */}
      </main>
    </div>
  );
};

export default DashboardLayout;
