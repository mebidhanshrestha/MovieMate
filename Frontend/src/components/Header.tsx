import React, { useState, useEffect, useRef } from "react";
import { Menu, X, User } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';
import logo from "../assets/images/moviemate-logo.svg";

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="container w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-10">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              <img src={logo} alt="logo" width={208} height={50} />
            </a>
            <div className="hidden md:block">
              <div className="flex items-center space-x-6">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/";
                  }}
                  className={`text-gray-700 hover:text-primary py-2 text-base font-light transition-colors duration-200 ${location.pathname === '/' && 'text-primary'}`}
                >
                  Home
                </a>
                <a
                  href="/movies"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/movies";
                  }}
                  className={`text-gray-700 hover:text-primary py-2 text-base font-light transition-colors duration-200 ${location.pathname === '/movies' && 'text-primary'}`}
                >
                  Movies
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-primary py-2 text-base font-light transition-colors duration-200"
                >
                  History
                </a>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-x-12">
            <div className="flex items-center gap-x-5">
              <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5902 2.33331C20.8552 2.33331 25.9512 7.42931 25.9512 13.6943C25.9512 16.6501 24.8169 19.346 22.9606 21.3692L26.6132 25.0141C26.955 25.356 26.9562 25.909 26.6144 26.2508C26.444 26.4235 26.2189 26.5086 25.9949 26.5086C25.772 26.5086 25.548 26.4235 25.3765 26.2531L21.6799 22.5668C19.7353 24.1241 17.2697 25.0565 14.5902 25.0565C8.32522 25.0565 3.22806 19.9593 3.22806 13.6943C3.22806 7.42931 8.32522 2.33331 14.5902 2.33331ZM14.5902 4.08331C9.29006 4.08331 4.97806 8.39415 4.97806 13.6943C4.97806 18.9945 9.29006 23.3065 14.5902 23.3065C19.8892 23.3065 24.2012 18.9945 24.2012 13.6943C24.2012 8.39415 19.8892 4.08331 14.5902 4.08331Z"
                    fill="#BEBEBE"
                  />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  fill="none"
                >
                  <path
                    d="M17.2284 24.5H12.5617M3.57121 6.78985C3.55447 5.09662 4.46737 3.51543 5.94212 2.68331M26.2143 6.78986C26.2311 5.09662 25.3182 3.51544 23.8434 2.68332M21.8951 9.33331C21.8951 7.4768 21.1576 5.69632 19.8448 4.38357C18.5321 3.07081 16.7516 2.33331 14.8951 2.33331C13.0385 2.33331 11.2581 3.07081 9.94532 4.38357C8.63256 5.69632 7.89506 7.4768 7.89506 9.33331C7.89506 12.9385 6.98561 15.4069 5.96967 17.0396C5.11271 18.4168 4.68423 19.1054 4.69994 19.2975C4.71734 19.5102 4.7624 19.5913 4.9338 19.7185C5.0886 19.8333 5.78642 19.8333 7.18206 19.8333H22.6081C24.0037 19.8333 24.7015 19.8333 24.8563 19.7185C25.0277 19.5913 25.0728 19.5102 25.0902 19.2975C25.1059 19.1054 24.6774 18.4168 23.8205 17.0396C22.8045 15.4069 21.8951 12.9385 21.8951 9.33331Z"
                    stroke="#BEBEBE"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {isLoggedIn ? (
              <div className="relative" ref={desktopDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                >
                  <User className="h-6 w-6 text-gray-600" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
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
              <div className="flex items-center gap-x-5">
                <a 
                  href="/login" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/login";
                  }}
                  className="bg-primary text-white px-8 py-2 rounded-[16px] text-sm font-medium hover:bg-amber-500 transition-colors duration-200"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/register";
                  }}
                  className="bg-gray-600 whitespace-nowrap text-white px-8 py-2 rounded-[16px] text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
                >
                  Register
                </a>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 lg:hidden">
            {isLoggedIn && (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
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
            )}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors duration-200"
              aria-expanded="false"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;