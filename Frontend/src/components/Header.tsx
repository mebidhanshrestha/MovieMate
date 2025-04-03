import React, { useState, useEffect, useRef } from "react";
import { Menu, X, User, Search, Bell } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';
import logo from "../assets/images/moviemate-logo.svg";

// Add custom breakpoint for extra small screens
// This will help handle tiny mobile screens like in the screenshot
const BREAKPOINTS = {
  xs: 480,  // Extra small screens
  sm: 640,
  md: 768,
  lg: 1024
};

// Add this CSS to your global styles or as a style tag in your HTML
// This ensures the proper breakpoint is added
// 
// @media (min-width: 480px) {
//   .xs\:block {
//     display: block;
//   }
// }
//

interface UserData {
  name: string;
  email: string;
  _id: string;
  role: string;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("id");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    if (token && userId) {
      setIsLoggedIn(true);
      setUserData({
        name: userName || "User",
        email: userEmail || "",
        _id: userId,
        role: localStorage.getItem("role") || "user"
      });
    } else {
      setIsLoggedIn(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(event.target as Node) &&
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        isMenuOpen &&
        !(event.target as Element).closest('button[aria-expanded]')
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const goToProfile = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent the dropdown from closing
    setIsProfileDropdownOpen(false);
    navigate("/profile");
  };

  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path ? 'text-primary' : '';

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="container w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-10">
            <a
              href="/"
              onClick={navigateTo("/")}
              className="flex-shrink-0"
            >
              <img src={logo} alt="MovieMate" width={208} height={50} className="w-auto h-10 sm:h-12" />
            </a>
            <div className="hidden md:block">
              <div className="flex items-center space-x-6">
                <a
                  href="/"
                  onClick={navigateTo("/")}
                  className={`text-gray-700 hover:text-primary py-2 text-base font-light transition-colors duration-200 ${isActive('/')}`}
                  aria-current={location.pathname === '/' ? 'page' : undefined}
                >
                  Home
                </a>
                <a
                  href="/movies"
                  onClick={navigateTo("/movies")}
                  className={`text-gray-700 hover:text-primary py-2 text-base font-light transition-colors duration-200 ${isActive('/movies')}`}
                  aria-current={location.pathname === '/movies' ? 'page' : undefined}
                >
                  Movies
                </a>
                <a
                  href="/history"
                  onClick={navigateTo("/history")}
                  className={`text-gray-700 hover:text-primary py-2 text-base font-light transition-colors duration-200 ${isActive('/history')}`}
                  aria-current={location.pathname === '/history' ? 'page' : undefined}
                >
                  History
                </a>
              </div>
            </div>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-x-4">
            <div className="flex items-center gap-x-3">
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-gray-500" />
              </button>
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {isLoggedIn ? (
              <div className="relative" ref={desktopDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User menu"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userData?.name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{userData?.email || ""}</p>
                    </div>
                    <button
                      onClick={goToProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-x-3">
                <a 
                  href="/login" 
                  onClick={navigateTo("/login")}
                  className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-amber-500 transition-colors duration-200 whitespace-nowrap"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  onClick={navigateTo("/register")}
                  className="bg-gray-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors duration-200 whitespace-nowrap"
                >
                  Register
                </a>
              </div>
            )}
          </div>

          {/* Tablet Right Section - New section for tablet view */}
          <div className="hidden sm:flex lg:hidden items-center gap-x-3">
            <button 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1.5 rounded-full hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-500" />
            </button>
            <button 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1.5 rounded-full hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
            
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User menu"
                >
                  <User className="h-4 w-4 text-gray-600" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userData?.name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{userData?.email || ""}</p>
                    </div>
                    <button
                      onClick={goToProfile}
                      className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-x-2">
                <a 
                  href="/login" 
                  onClick={navigateTo("/login")}
                  className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-amber-500 transition-colors duration-200 whitespace-nowrap"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  onClick={navigateTo("/register")}
                  className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors duration-200 whitespace-nowrap"
                >
                  Register
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Controls - Only visible on xs screens */}
          <div className="flex sm:hidden items-center gap-x-1 sm:gap-x-2">
            <button 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1.5"
              aria-label="Search"
            >
              <Search className="h-4 w-4 text-gray-500" />
            </button>
            
            <button 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1.5"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-gray-500" />
            </button>
            
            {isLoggedIn && (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User menu"
                >
                  <User className="h-3.5 w-3.5 text-gray-600" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userData?.name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{userData?.email || ""}</p>
                    </div>
                    <button
                      onClick={goToProfile}
                      className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors duration-200"
              aria-expanded={isMenuOpen}
              aria-label="Main menu"
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel - Only visible on xs screens, not on tablets */}
      {isMenuOpen && (
        <div 
          className="sm:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 z-50" 
          ref={mobileMenuRef}
        >
          <div className="py-1.5 space-y-0.5">
            <a
              href="/"
              onClick={navigateTo("/")}
              className={`block px-3 py-1.5 text-sm font-medium ${isActive('/') || 'text-gray-700 hover:bg-gray-100 hover:text-primary'} ${isActive('/') && 'bg-primary-50'}`}
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              Home
            </a>
            <a
              href="/movies"
              onClick={navigateTo("/movies")}
              className={`block px-3 py-1.5 text-sm font-medium ${isActive('/movies') || 'text-gray-700 hover:bg-gray-100 hover:text-primary'} ${isActive('/movies') && 'bg-primary-50'}`}
              aria-current={location.pathname === '/movies' ? 'page' : undefined}
            >
              Movies
            </a>
            <a
              href="/history"
              onClick={navigateTo("/history")}
              className={`block px-3 py-1.5 text-sm font-medium ${isActive('/history') || 'text-gray-700 hover:bg-gray-100 hover:text-primary'} ${isActive('/history') && 'bg-primary-50'}`}
              aria-current={location.pathname === '/history' ? 'page' : undefined}
            >
              History
            </a>
            {!isLoggedIn && (
              <div className="px-3 py-2 space-y-2 border-t border-gray-50 mt-1.5">
                <a 
                  href="/login" 
                  onClick={navigateTo("/login")}
                  className="block w-full text-center bg-primary text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-amber-500 transition-colors duration-200"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  onClick={navigateTo("/register")}
                  className="block w-full text-center bg-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-gray-700 transition-colors duration-200"
                >
                  Register
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;