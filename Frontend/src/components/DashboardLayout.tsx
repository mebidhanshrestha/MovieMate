import { Link, Outlet, useNavigate } from 'react-router-dom';

const DashboardLayout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-5">
        <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <Link to="/dashboard/menu" className="block p-2 rounded hover:bg-gray-700">
                Manage Menu
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/dashboard/movie" className="block p-2 rounded hover:bg-gray-700">
                Movie
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/dashboard/movie-allocate" className="block p-2 rounded hover:bg-gray-700">
                Movie Allocate
              </Link>
            </li>
            <li className="mt-6">
              <button 
                onClick={handleLogout} 
                className="w-full bg-red-500 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100">
        <Outlet /> {/* This will render child components like AdminMenu */}
      </main>
    </div>
  );
};

export default DashboardLayout;
