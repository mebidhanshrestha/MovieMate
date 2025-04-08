import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/images/moviemate-logo.svg";
import { 
  LayoutDashboard, 
  Film, 
  Calendar, 
  Coffee, 
  LogOut, 
  Menu as MenuIcon,
  X,
  BookText
} from "lucide-react";

const DashboardLayout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/dashboard/movie", label: "Manage Movies", icon: <Film className="w-5 h-5" /> },
    { path: "/dashboard/movie-allocate", label: "Movie Allocate", icon: <Calendar className="w-5 h-5" /> },
    { path: "/dashboard/menu", label: "Manage Menu", icon: <Coffee className="w-5 h-5" /> },
    { path: "/dashboard/bookings", label: "Bookings", icon: <BookText className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside 
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-gray-800 text-white transition-all duration-300 hidden md:block relative`}
      >
        <div className="sticky top-0 flex flex-col h-screen">
          {/* Logo and collapse button */}
          <div className={`flex ${collapsed ? "justify-center" : "justify-between"} items-center p-4 border-b border-gray-700`}>
            {!collapsed && (
              <div className="flex items-center">
                <img src={logo} alt="MovieMate" className="h-10" />
              </div>
            )}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              {collapsed ? (
                <MenuIcon className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${
                      collapsed ? "justify-center" : "justify-start space-x-3"
                    } p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path) 
                        ? "bg-[#8a6e00] text-white" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer that pushes logout to bottom */}
          <div className="flex-grow"></div>

          {/* Logout button */}
          <div className="w-full p-4 border-t border-gray-700 mt-8">
            <button
              onClick={handleLogout}
              className={`flex items-center ${
                collapsed ? "justify-center" : "justify-start space-x-3"
              } w-full p-3 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white`}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <div className="flex items-center">
              <img src={logo} alt="MovieMate" className="h-10" />
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.path) 
                        ? "bg-[#8a6e00] text-white" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer that pushes logout to bottom */}
          <div className="flex-grow"></div>

          <div className="w-full p-4 border-t border-gray-700 mt-8">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 md:hidden"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-700 text-[#FBC700] flex items-center justify-center font-semibold">
                AM
              </div>
              <span className="hidden sm:inline font-medium">Admin User</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;